import { AuditResult, Finding } from '../types';

/**
 * Enterprise-Grade Bidirectional DLP (Data Loss Prevention) Service
 * 1. Anonymizes sensitive identifiers into deterministic semantic aliases (e.g., CLOUD_ID_1)
 *    while permanently scrubbing high-entropy secrets (API keys, PEM keys, passwords).
 * 2. De-anonymizes semantic aliases in returned AuditResult objects locally on the client
 *    so HCL fixes, resource paths, and Mermaid diagrams retain valid resource names
 *    without ever exposing raw identifiers to external LLM APIs or untrusted networks.
 */

interface RedactionEntry {
  alias: string;
  original: string;
  type: string;
  reversible: boolean;
}

// Standard architectural / GCP keywords that must NEVER be aliased so audit reasoning works
const IGNORE_PATTERNS = new Set([
  '0.0.0.0/0',
  '::/0',
  '35.235.240.0/20', // Google IAP CIDR
  '199.36.153.8/30', // Restricted Google APIs
  '199.36.153.4/30', // Private Google APIs
  'default',
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'asia-east1',
  'asia-northeast1',
  'asia-southeast1',
  'standard',
  'enforced',
  'inherited',
  'true',
  'false',
  'null'
]);

export interface AuditDlpResult {
  sanitizedCode: string;
  redactionCount: number;
  types: Record<string, number>;
  /** Alias -> Original value mapping for non-secret identifiers (keep client-side only!) */
  aliasMap: Record<string, string>;
}

export const anonymizeHcl = (code: string): AuditDlpResult => {
  if (!code) {
    return { sanitizedCode: code, redactionCount: 0, types: {}, aliasMap: {} };
  }

  const redactionMap: Record<string, RedactionEntry> = {};
  const aliasMap: Record<string, string> = {};
  let redactionCount = 0;
  const types: Record<string, number> = {};

  const getAlias = (original: string, category: string): string => {
    const trimmed = original.trim();
    if (!trimmed || IGNORE_PATTERNS.has(trimmed.toLowerCase())) {
      return original;
    }
    // Skip if already an alias token from an earlier client-side DLP pass
    if (/^(?:IDENTITY|IP_RANGE|CLOUD_ID|RESOURCE_NAME|NETWORK_TOPOGRAPHY|ORG_METADATA|ENV_INDICATOR)_\d+$/.test(trimmed)) {
      return original;
    }
    if (trimmed.startsWith('[REDACTED')) {
      return original;
    }

    const key = `${category}:${trimmed}`;
    if (!redactionMap[key]) {
      const index = Object.values(redactionMap).filter((v) => v.type === category).length + 1;
      const alias = `${category.toUpperCase()}_${index}`;
      redactionMap[key] = { alias, original: trimmed, type: category, reversible: true };
      aliasMap[alias] = trimmed;
      redactionCount++;
      types[category] = (types[category] || 0) + 1;
    }
    return redactionMap[key].alias;
  };

  let processed = code;

  // 1. Global High-Entropy Secret Scanning FIRST (Non-reversible permanent scrub!)
  // GCP API Keys
  const GCP_KEY_REGEX = /AIzaSy[A-Za-z0-9\-_]{10,45}/g;
  processed = processed.replace(GCP_KEY_REGEX, () => {
    redactionCount++;
    types['High_Entropy_Secret'] = (types['High_Entropy_Secret'] || 0) + 1;
    return '[REDACTED_GCP_API_KEY]';
  });

  // PEM Private Keys (RSA, EC, PKCS8, OPENSSH)
  const PEM_KEY_REGEX = /-----BEGIN [A-Z0-9\s]+?PRIVATE KEY-----[\s\S]+?-----END [A-Z0-9\s]+?PRIVATE KEY-----/g;
  processed = processed.replace(PEM_KEY_REGEX, () => {
    redactionCount++;
    types['High_Entropy_Secret'] = (types['High_Entropy_Secret'] || 0) + 1;
    return '[REDACTED_PEM_PRIVATE_KEY]';
  });

  // AWS Access Key IDs
  const AWS_KEY_REGEX = /\bAKIA[0-9A-Z]{16}\b/g;
  processed = processed.replace(AWS_KEY_REGEX, () => {
    redactionCount++;
    types['High_Entropy_Secret'] = (types['High_Entropy_Secret'] || 0) + 1;
    return '[REDACTED_AWS_ACCESS_KEY_ID]';
  });

  // GitHub PATs / Slack tokens
  const TOKEN_LITERAL_REGEX = /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[baprs]-[A-Za-z0-9-]{15,})\b/g;
  processed = processed.replace(TOKEN_LITERAL_REGEX, () => {
    redactionCount++;
    types['High_Entropy_Secret'] = (types['High_Entropy_Secret'] || 0) + 1;
    return '[REDACTED_TOKEN_SECRET]';
  });

  // 2. Hard-Redact Secret Key-Value Assignments (Non-reversible)
  const SECRET_KEYS = 'password|passwd|db_password|secret|client_secret|key_data|private_key|api[_-]?key|token|access_key|auth_token|certificate|connection_string';
  const SECRET_REGEX = new RegExp(`((?:${SECRET_KEYS})\\s*[:=]\\s*["'])(?!\\[REDACTED)([^"']+)(["'])`, 'gi');
  processed = processed.replace(SECRET_REGEX, (_m, p1, _p2, p3) => {
    redactionCount++;
    types['Secret_Assignment'] = (types['Secret_Assignment'] || 0) + 1;
    return `${p1}[REDACTED_SECRET]${p3}`;
  });

  // 3. Scrub Emails / Identities (Reversible alias)
  const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  processed = processed.replace(EMAIL_REGEX, (match) => getAlias(match, 'Identity'));

  // 4. Scrub IP Ranges (IPv4/CIDR, preserving 0.0.0.0/0 and Google IAP/Private API ranges)
  const IP_REGEX = /\b(?!(?:0\.0\.0\.0(?:\/0)?)\b)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?\b/g;
  processed = processed.replace(IP_REGEX, (match) => getAlias(match, 'IP_Range'));

  // 5. Scrub Sensitive Key-Value Pairs (Projects, Billing, Orgs)
  const ID_KEYS = 'project|project_id|org_id|billing_account|folder_id|service_account_id|account_id';
  const ID_REGEX = new RegExp(`((?:${ID_KEYS})\\s*[:=]\\s*["'])([a-zA-Z0-9-_\\.:]{4,128})(["'])`, 'gi');
  processed = processed.replace(ID_REGEX, (_m, p1, p2, p3) => `${p1}${getAlias(p2, 'Cloud_ID')}${p3}`);

  // 6. Scrub Global Resource Names (Buckets, DBs, Registries)
  const RES_KEYS = 'bucket|bucket_name|database_instance|instance_name|repository_id|container_name';
  const RES_REGEX = new RegExp(`((?:${RES_KEYS})\\s*[:=]\\s*["'])([a-z0-9-._]{3,128})(["'])`, 'gi');
  processed = processed.replace(RES_REGEX, (_m, p1, p2, p3) => `${p1}${getAlias(p2, 'Resource_Name')}${p3}`);

  // 7. Scrub Networking Topography (VPCs, Subnets, Domains)
  const NET_KEYS = 'network|subnetwork|vpc|dns_name|domain_name';
  const NET_REGEX = new RegExp(`((?:${NET_KEYS})\\s*[:=]\\s*["'])([a-z][a-z0-9.-]{2,128})(["'])`, 'gi');
  processed = processed.replace(NET_REGEX, (_m, p1, p2, p3) => `${p1}${getAlias(p2, 'Network_Topography')}${p3}`);

  // 8. Scrub Metadata & Labels (Owner, Team, Cost Center)
  const META_KEYS = 'owner|creator|contact|team|cost_center|business_unit';
  const META_REGEX = new RegExp(`((?:${META_KEYS})\\s*[:=]\\s*["'])([^"']+)(["'])`, 'gi');
  processed = processed.replace(META_REGEX, (_m, p1, p2, p3) => `${p1}${getAlias(p2, 'Org_Metadata')}${p3}`);

  // 9. Scrub Environment & Tier Indicators in explicit naming attributes
  const ENV_INDICATORS = 'prod|production|master|primary|main|staging|stg|dev|development|test|uat|dr|backup|secondary';
  const ENV_KEY_REGEX = new RegExp(`((?:\\bname|\\benv|\\benvironment|\\btier|\\brole)\\s*[:=]\\s*["'])([^"']*?(?:${ENV_INDICATORS})[^"']*?)(["'])`, 'gi');
  processed = processed.replace(ENV_KEY_REGEX, (_m, p1, p2, p3) => `${p1}${getAlias(p2, 'Env_Indicator')}${p3}`);

  return {
    sanitizedCode: processed,
    redactionCount,
    types,
    aliasMap
  };
};

/**
 * Replaces semantic aliases (e.g. CLOUD_ID_1 -> finance-prod-12345) in a string.
 * Longer aliases (e.g. CLOUD_ID_12 before CLOUD_ID_1) are replaced first to prevent prefix collisions.
 */
export const deanonymizeText = (text: string | undefined, aliasMap: Record<string, string>): string => {
  if (!text) return '';
  const aliases = Object.keys(aliasMap).sort((a, b) => b.length - a.length);
  if (aliases.length === 0) return text;

  let restored = text;
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    restored = restored.replace(new RegExp(`\\b${escaped}\\b`, 'g'), aliasMap[alias]);
  }
  return restored;
};

const deanonymizeFinding = (f: Finding, aliasMap: Record<string, string>): Finding => ({
  ...f,
  title: deanonymizeText(f.title, aliasMap),
  description: deanonymizeText(f.description, aliasMap),
  remediation: deanonymizeText(f.remediation, aliasMap),
  fix: f.fix ? deanonymizeText(f.fix, aliasMap) : f.fix,
  originalSnippet: f.originalSnippet ? deanonymizeText(f.originalSnippet, aliasMap) : f.originalSnippet,
  resourceAddress: f.resourceAddress ? deanonymizeText(f.resourceAddress, aliasMap) : f.resourceAddress,
  fileName: f.fileName ? deanonymizeText(f.fileName, aliasMap) : f.fileName
});

/**
 * Restores non-secret semantic aliases across an entire AuditResult.
 * High-entropy secrets ([REDACTED_*]) are never stored in aliasMap and remain permanently redacted.
 */
export const deanonymizeAuditResult = (
  result: AuditResult,
  aliasMap: Record<string, string>
): AuditResult => {
  if (!aliasMap || Object.keys(aliasMap).length === 0) {
    return result;
  }

  return {
    ...result,
    summary: deanonymizeText(result.summary, aliasMap),
    diagram: result.diagram ? deanonymizeText(result.diagram, aliasMap) : result.diagram,
    categories: result.categories.map((c) => ({
      ...c,
      explanation: c.explanation ? deanonymizeText(c.explanation, aliasMap) : c.explanation
    })),
    findings: result.findings.map((f) => deanonymizeFinding(f, aliasMap)),
    waivedFindings: result.waivedFindings?.map((f) => deanonymizeFinding(f, aliasMap)),
    finops: result.finops
      ? {
          ...result.finops,
          lineItems: result.finops.lineItems.map((item) => ({
            ...item,
            resourceAddress: deanonymizeText(item.resourceAddress, aliasMap),
            recommendation: deanonymizeText(item.recommendation, aliasMap)
          }))
        }
      : result.finops
  };
};
