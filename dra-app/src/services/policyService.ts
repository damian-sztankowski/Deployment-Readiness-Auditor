import yaml from 'js-yaml';
import { CategoryScore, DraPolicyConfig, DraWaiver, Finding, Severity } from '../types';
import { ParsedResourceBlock, splitMultiFileCode } from './staticAnalyzer';

/**
 * Organization Policy-as-Code (.dra.yaml) & Time-Bounded Risk Waiver Engine
 * Allows platform & security engineering teams to enforce custom organizational guardrails
 * (required labels, EU/US data-residency regions, banned legacy machine prefixes, custom pillar weights)
 * and manage auditable, expiring risk waivers without muting findings permanently.
 */

export const parsePolicyYaml = (policyText?: string): DraPolicyConfig | null => {
  if (!policyText || !policyText.trim()) return null;
  try {
    const raw = yaml.load(policyText) as any;
    if (!raw || typeof raw !== 'object') return null;
    return {
      organization: typeof raw.organization === 'string' ? raw.organization : undefined,
      requiredLabels: Array.isArray(raw.requiredLabels) ? raw.requiredLabels.map(String) : undefined,
      allowedRegions: Array.isArray(raw.allowedRegions) ? raw.allowedRegions.map(String) : undefined,
      bannedMachinePrefixes: Array.isArray(raw.bannedMachinePrefixes) ? raw.bannedMachinePrefixes.map(String) : undefined,
      pillarWeights: raw.pillarWeights && typeof raw.pillarWeights === 'object' ? raw.pillarWeights : undefined,
      customRules: Array.isArray(raw.customRules) ? raw.customRules.map(String) : undefined,
      waivers: Array.isArray(raw.waivers)
        ? raw.waivers.map((w: any): DraWaiver => ({
            id: String(w?.id || ''),
            resource: w?.resource ? String(w.resource) : undefined,
            reason: String(w?.reason || 'Approved organizational risk exception'),
            approvedBy: w?.approvedBy ? String(w.approvedBy) : undefined,
            expires: w?.expires ? String(w.expires) : undefined
          }))
        : undefined
    };
  } catch {
    return null;
  }
};

/**
 * Extracts an embedded `.dra.yaml` / `dra.yaml` file if uploaded as part of a multi-file directory.
 */
export const extractEmbeddedPolicyFromFiles = (inputCode: string): DraPolicyConfig | null => {
  const files = splitMultiFileCode(inputCode);
  const policyFile = files.find((f) => {
    const base = f.fileName.split('/').pop()?.toLowerCase() || '';
    return base === '.dra.yaml' || base === 'dra.yaml' || base === '.dra.yml' || base === 'dra.yml';
  });
  return policyFile ? parsePolicyYaml(policyFile.content) : null;
};

const matchesRegionPattern = (region: string, pattern: string): boolean => {
  if (pattern.endsWith('*')) {
    return region.toLowerCase().startsWith(pattern.slice(0, -1).toLowerCase());
  }
  return region.toLowerCase() === pattern.toLowerCase();
};

export const evaluatePolicyGuardrails = (
  blocks: ParsedResourceBlock[],
  policy: DraPolicyConfig | null,
  detectedRegion: string
): Finding[] => {
  if (!policy) return [];
  const findings: Finding[] = [];
  let seq = 1;

  // 1. Region Data Residency check
  if (policy.allowedRegions && policy.allowedRegions.length > 0) {
    const allowed = policy.allowedRegions.some((pat) => matchesRegionPattern(detectedRegion, pat));
    if (!allowed) {
      const providerBlock = blocks.find((b) => b.blockType === 'provider');
      findings.push({
        id: `pol-region-${seq++}`,
        severity: Severity.CRITICAL,
        category: 'Security',
        title: `Data Residency Policy Violation: Disallowed Region '${detectedRegion}'`,
        description: `Configured GCP region '${detectedRegion}' violates organizational data-residency guardrails. Allowed regions: ${policy.allowedRegions.join(', ')}.`,
        remediation: `Update provider/resource region to an approved jurisdiction (${policy.allowedRegions.join(', ')}).`,
        fix: `provider "google" {\n  region = "${policy.allowedRegions[0].replace('*', 'west1')}"\n}`,
        fileName: providerBlock?.fileName || 'main.tf',
        lineNumber: providerBlock?.startLine || 1,
        source: 'policy',
        compliance: [
          {
            standard: 'EU GDPR',
            controlId: 'Chapter V (Data Residency)',
            description: 'Enforce geographic data sovereignty boundaries defined in .dra.yaml.',
            impact: 'Cross-border data residency violation.'
          }
        ]
      });
    }
  }

  // 2. Required Labels & Banned Machine Prefixes
  for (const b of blocks) {
    if (b.blockType !== 'resource') continue;

    if (policy.requiredLabels && policy.requiredLabels.length > 0) {
      const labelBlockMatch = b.rawText.match(/labels\s*=\s*\{([\s\S]*?)\}/);
      if (labelBlockMatch) {
        const labelBody = labelBlockMatch[1];
        const missing = policy.requiredLabels.filter(
          (req) => !new RegExp(`\\b${req.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`).test(labelBody)
        );
        if (missing.length > 0) {
          findings.push({
            id: `pol-lbl-${seq++}`,
            severity: Severity.MEDIUM,
            category: 'Operational Excellence',
            title: `Missing Mandatory Org Labels on ${b.address}: ${missing.join(', ')}`,
            description: `Organization policy requires labels [${policy.requiredLabels.join(', ')}], but '${b.address}' is missing: ${missing.join(', ')}.`,
            remediation: `Add missing mandatory label keys (${missing.join(', ')}) to '${b.address}'.`,
            fix: `labels = {\n${policy.requiredLabels.map((k) => `  ${k} = "required-value"`).join('\n')}\n}`,
            resourceAddress: b.address,
            fileName: b.fileName,
            lineNumber: b.startLine,
            endLineNumber: b.endLine,
            source: 'policy',
            compliance: []
          });
        }
      }
    }

    if (policy.bannedMachinePrefixes && policy.bannedMachinePrefixes.length > 0 && b.resourceType === 'google_compute_instance') {
      const mtMatch = b.rawText.match(/machine_type\s*=\s*"([^"]+)"/);
      if (mtMatch) {
        const mt = mtMatch[1];
        const banned = policy.bannedMachinePrefixes.find((prefix) => mt.startsWith(prefix));
        if (banned) {
          findings.push({
            id: `pol-mt-${seq++}`,
            severity: Severity.HIGH,
            category: 'Cost Optimization',
            title: `Banned Machine Family '${mt}' on ${b.address}`,
            description: `Machine type '${mt}' matches banned prefix '${banned}' in .dra.yaml organization policy.`,
            remediation: 'Switch to an organization-approved modern machine family (e.g., e2-standard-*, n4-standard-*, c4a-standard-*).',
            fix: b.rawText.replace(`"${mt}"`, '"e2-standard-2"'),
            originalSnippet: b.rawText,
            resourceAddress: b.address,
            fileName: b.fileName,
            lineNumber: b.startLine,
            endLineNumber: b.endLine,
            source: 'policy',
            compliance: []
          });
        }
      }
    }
  }

  return findings;
};

const isWaiverExpired = (expires?: string, now = new Date()): boolean => {
  if (!expires) return false;
  const expDate = new Date(expires);
  if (Number.isNaN(expDate.getTime())) return false;
  return expDate.getTime() < now.getTime();
};

export interface WaiverEvaluationResult {
  activeFindings: Finding[];
  waivedFindings: Finding[];
  activeWaiversCount: number;
  expiredWaiversCount: number;
}

export const applyPolicyWaivers = (
  findings: Finding[],
  policy: DraPolicyConfig | null,
  now = new Date()
): WaiverEvaluationResult => {
  if (!policy?.waivers || policy.waivers.length === 0) {
    return {
      activeFindings: findings,
      waivedFindings: [],
      activeWaiversCount: 0,
      expiredWaiversCount: 0
    };
  }

  let expiredWaiversCount = 0;
  const validWaivers = policy.waivers.filter((w) => {
    if (!w.id) return false;
    if (isWaiverExpired(w.expires, now)) {
      expiredWaiversCount++;
      return false;
    }
    return true;
  });

  const activeFindings: Finding[] = [];
  const waivedFindings: Finding[] = [];

  for (const f of findings) {
    const matched = validWaivers.find((w) => {
      const targetId = w.id.toLowerCase();
      const idMatches =
        f.id.toLowerCase() === targetId ||
        f.title.toLowerCase().includes(targetId) ||
        (f.compliance || []).some((c) => c.controlId.toLowerCase().includes(targetId));

      if (!idMatches) return false;
      if (w.resource) {
        const resTarget = w.resource.toLowerCase();
        return (
          (f.resourceAddress || '').toLowerCase().includes(resTarget) ||
          (f.fileName || '').toLowerCase().includes(resTarget) ||
          f.title.toLowerCase().includes(resTarget)
        );
      }
      return true;
    });

    if (matched) {
      waivedFindings.push({
        ...f,
        waived: true,
        waiverReason: matched.reason,
        waiverApprovedBy: matched.approvedBy,
        waiverExpires: matched.expires
      });
    } else {
      activeFindings.push(f);
    }
  }

  return {
    activeFindings,
    waivedFindings,
    activeWaiversCount: waivedFindings.length,
    expiredWaiversCount
  };
};

export const applyPillarWeights = (
  categories: CategoryScore[],
  weights?: Record<string, number>
): number => {
  if (categories.length === 0) return 100;
  if (!weights || Object.keys(weights).length === 0) {
    return Math.round(categories.reduce((acc, c) => acc + c.score, 0) / categories.length);
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of categories) {
    const key = Object.keys(weights).find((k) => c.name.toLowerCase().includes(k.toLowerCase()));
    const w = key ? weights[key] : 1;
    weightedSum += c.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
};
