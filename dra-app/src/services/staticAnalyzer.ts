import yaml from 'js-yaml';
import { CategoryScore, Finding, Severity } from '../types';

export interface ParsedResourceBlock {
  fileName: string;
  blockType: 'resource' | 'provider' | 'variable' | 'module' | 'k8s' | 'dockerfile';
  resourceType: string;
  resourceName: string;
  address: string;
  startLine: number;
  endLine: number;
  rawText: string;
}

export interface SplitFileEntry {
  fileName: string;
  content: string;
}

/**
 * Splits multi-file concatenated payloads (`### FILE: path/to/file.tf ###`) into individual files.
 */
export const splitMultiFileCode = (inputCode: string): SplitFileEntry[] => {
  const lines = inputCode.split(/\r?\n/);
  const files: SplitFileEntry[] = [];
  let currentFile = 'main.tf';
  let buffer: string[] = [];
  let sawHeader = false;

  for (const line of lines) {
    const headerMatch = line.match(/^\s*###\s*FILE:\s*(.+?)\s*###\s*$/);
    if (headerMatch) {
      if (sawHeader || buffer.some((l) => l.trim() && !l.trim().startsWith('# --- MULTI-FILE'))) {
        files.push({ fileName: currentFile, content: buffer.join('\n') });
      }
      currentFile = headerMatch[1].trim();
      buffer = [];
      sawHeader = true;
    } else if (!line.trim().startsWith('# --- MULTI-FILE PROJECT ---')) {
      buffer.push(line);
    }
  }

  if (buffer.length > 0 || files.length === 0) {
    files.push({ fileName: currentFile, content: buffer.join('\n') });
  }

  return files;
};

/**
 * Extracts Terraform variable defaults and .tfvars overrides so expressions like `var.region`
 * or `var.allowed_cidrs` can be resolved deterministically before rule evaluation.
 */
export const extractTerraformVariables = (files: SplitFileEntry[]): Record<string, string> => {
  const vars: Record<string, string> = {};

  // Pass 1: variable "foo" { default = "bar" }
  for (const file of files) {
    if (!file.fileName.endsWith('.tf') && !file.fileName.endsWith('.tofu')) continue;
    const varRegex = /variable\s+"([^"]+)"\s*\{([\s\S]*?)\n\}/g;
    let match: RegExpExecArray | null;
    while ((match = varRegex.exec(file.content)) !== null) {
      const varName = match[1];
      const body = match[2];
      const defStr = body.match(/default\s*=\s*"([^"]*)"/);
      const defArr = body.match(/default\s*=\s*(\[[^\]]*\])/);
      const defScalar = body.match(/default\s*=\s*(true|false|\d+)/);
      if (defStr) vars[varName] = defStr[1];
      else if (defArr) vars[varName] = defArr[1];
      else if (defScalar) vars[varName] = defScalar[1];
    }
  }

  // Pass 2: .tfvars overrides (higher precedence)
  for (const file of files) {
    if (!file.fileName.endsWith('.tfvars')) continue;
    for (const line of file.content.split(/\r?\n/)) {
      const m = line.match(/^\s*([a-zA-Z0-9_-]+)\s*=\s*(.+?)\s*(?:#.*)?$/);
      if (m) {
        vars[m[1]] = m[2].replace(/^"|"$/g, '');
      }
    }
  }

  return vars;
};

/**
 * Brace-balanced parser for HCL blocks (`resource`, `provider`, `module`) with exact start & end lines.
 */
export const parseHclBlocks = (files: SplitFileEntry[]): ParsedResourceBlock[] => {
  const blocks: ParsedResourceBlock[] = [];

  for (const file of files) {
    const fn = file.fileName.toLowerCase();
    if (fn.endsWith('.json') || fn.endsWith('.yaml') || fn.endsWith('.yml') || fn.includes('dockerfile')) {
      continue;
    }

    const lines = file.content.split(/\r?\n/);
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        i++;
        continue;
      }

      const resMatch = trimmed.match(/^resource\s+"([^"]+)"\s+"([^"]+)"\s*\{/);
      const provMatch = trimmed.match(/^provider\s+"([^"]+)"\s*\{/);
      const modMatch = trimmed.match(/^module\s+"([^"]+)"\s*\{/);

      if (resMatch || provMatch || modMatch) {
        const startLine = i + 1;
        let depth = 0;
        let j = i;
        for (; j < lines.length; j++) {
          // Strip quoted strings & single-line comments before counting braces
          const codeOnly = lines[j]
            .replace(/"(?:\\.|[^"\\])*"/g, '""')
            .replace(/(?:#|\/\/).*$/, '');
          for (const ch of codeOnly) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          if (depth <= 0 && j >= i) {
            break;
          }
        }
        const endLine = Math.min(j + 1, lines.length);
        const rawText = lines.slice(i, endLine).join('\n');

        if (resMatch) {
          blocks.push({
            fileName: file.fileName,
            blockType: 'resource',
            resourceType: resMatch[1],
            resourceName: resMatch[2],
            address: `${resMatch[1]}.${resMatch[2]}`,
            startLine,
            endLine,
            rawText
          });
        } else if (provMatch) {
          blocks.push({
            fileName: file.fileName,
            blockType: 'provider',
            resourceType: provMatch[1],
            resourceName: provMatch[1],
            address: `provider.${provMatch[1]}`,
            startLine,
            endLine,
            rawText
          });
        } else if (modMatch) {
          blocks.push({
            fileName: file.fileName,
            blockType: 'module',
            resourceType: 'module',
            resourceName: modMatch[1],
            address: `module.${modMatch[1]}`,
            startLine,
            endLine,
            rawText
          });
        }
        i = endLine;
        continue;
      }
      i++;
    }
  }

  return blocks;
};

const interpolateVars = (raw: string, vars: Record<string, string>): string => {
  let out = raw;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\bvar\\.${k}\\b`, 'g'), JSON.stringify(v));
    out = out.replace(new RegExp(`\\$\\{var\\.${k}\\}`, 'g'), v);
  }
  return out;
};

const injectAttributeIntoBlock = (rawBlock: string, attrSnippet: string): string => {
  const lines = rawBlock.split('\n');
  if (lines.length < 2) return `${rawBlock}\n${attrSnippet}`;
  const indented = attrSnippet
    .split('\n')
    .map((l) => (l.trim() ? `  ${l}` : l))
    .join('\n');
  return [...lines.slice(0, -1), indented, lines[lines.length - 1]].join('\n');
};

export interface StaticAnalysisOutput {
  findings: Finding[];
  blocks: ParsedResourceBlock[];
  detectedRegion: string;
  baselineCategories: CategoryScore[];
  fallbackDiagram: string;
}

/**
 * Deterministic Static Analyzer across Terraform/OpenTofu HCL, tfplan.json, Kubernetes/GKE YAML, and Dockerfiles.
 * Provides prompt-injection-immune CIS GCP v2.0 / Well-Architected baseline checks with exact line ranges.
 */
export const runDeterministicStaticAudit = (inputCode: string): StaticAnalysisOutput => {
  const files = splitMultiFileCode(inputCode);
  const vars = extractTerraformVariables(files);
  const blocks = parseHclBlocks(files);
  const findings: Finding[] = [];
  let detectedRegion = vars['region'] || 'us-central1';

  let idSeq = 1;
  const nextId = (prefix: string) => `${prefix}-${idSeq++}`;

  // Detect region from provider "google"
  for (const b of blocks) {
    if (b.blockType === 'provider' && (b.resourceType === 'google' || b.resourceType === 'google-beta')) {
      const resolved = interpolateVars(b.rawText, vars);
      const regMatch = resolved.match(/region\s*=\s*"([^"]+)"/);
      if (regMatch) detectedRegion = regMatch[1];
    }
  }

  // --- 1. Evaluate HCL Resource Blocks ---
  const attachedDiskNames = new Set<string>();
  for (const b of blocks) {
    if (b.resourceType === 'google_compute_instance' || b.resourceType === 'google_compute_attached_disk') {
      const refs = b.rawText.match(/google_compute_disk\.([a-zA-Z0-9_-]+)/g) || [];
      refs.forEach((r) => attachedDiskNames.add(r.split('.')[1]));
    }
  }

  for (const b of blocks) {
    if (b.blockType !== 'resource') continue;
    const text = interpolateVars(b.rawText, vars);

    // Check hardcoded secrets / redacted secret markers in any resource
    if (/\[REDACTED_(?:SECRET|GCP_API_KEY|PEM_PRIVATE_KEY|AWS_ACCESS_KEY_ID|TOKEN_SECRET)\]|AIzaSy[A-Za-z0-9\-_]{10,}|(?:api[_-]?key|password|secret|private_key)\s*=\s*"[^"$]+"/i.test(b.rawText)) {
      const fixedBlock = b.rawText.replace(
        /((?:api[_-]?key|password|secret|token)\s*=\s*)"[^"]*"/gi,
        '$1data.google_secret_manager_secret_version.app_secret.secret_data'
      );
      findings.push({
        id: nextId('det-sec'),
        severity: Severity.CRITICAL,
        category: 'Security',
        title: `Hardcoded Secret / Credential in ${b.address}`,
        description: `Resource '${b.address}' embeds plaintext credentials or API keys directly in IaC configuration or instance metadata, exposing secrets in Terraform state files and version control.`,
        remediation: 'Migrate secrets to Google Secret Manager and reference secret versions dynamically or inject via Workload Identity.',
        fix: fixedBlock !== b.rawText ? fixedBlock : `# Reference via Google Secret Manager:\ndata "google_secret_manager_secret_version" "app_secret" {\n  secret = "projects/PROJECT_ID/secrets/app-secret"\n}`,
        originalSnippet: b.rawText,
        resourceAddress: b.address,
        fileName: b.fileName,
        lineNumber: b.startLine,
        endLineNumber: b.endLine,
        source: 'deterministic',
        compliance: [
          {
            standard: 'CIS GCP Benchmark',
            controlId: 'CIS 1.4',
            description: 'Ensure user-managed/hardcoded keys and secrets are eliminated from code and state.',
            impact: 'Credential compromise via Terraform state leakage or metadata SSRF.'
          },
          {
            standard: 'NIST 800-53',
            controlId: 'IA-5',
            description: 'Authenticator Management — protect authenticators from unauthorized disclosure.',
            impact: 'Full unauthorized API/resource takeover.'
          },
          {
            standard: 'SOC 2',
            controlId: 'CC6.1',
            description: 'Logical access security software, infrastructure, and architectures.',
            impact: 'Audit failure on secret lifecycle management.'
          }
        ]
      });
    }

    // Firewall checks (google_compute_firewall)
    if (b.resourceType === 'google_compute_firewall') {
      const isIngressOpen = /source_ranges\s*=\s*\[[^\]]*(?:0\.0\.0\.0\/0|::\/0)[^\]]*\]/.test(text);
      if (isIngressOpen) {
        const allowsAllPorts = /ports\s*=\s*\[\s*"0-65535"\s*\]/.test(text) || /allow\s*\{\s*protocol\s*=\s*"all"/s.test(text);
        const allowsSsh = /ports\s*=\s*\[[^\]]*"22"[^\]]*\]/.test(text);
        const allowsRdp = /ports\s*=\s*\[[^\]]*"3389"[^\]]*\]/.test(text);
        const fixedBlock = b.rawText
          .replace(/0\.0\.0\.0\/0/g, '35.235.240.0/20')
          .replace(/"0-65535"/g, '"443"');

        findings.push({
          id: nextId('det-fw'),
          severity: allowsAllPorts || allowsSsh || allowsRdp ? Severity.CRITICAL : Severity.HIGH,
          category: 'Security',
          title: allowsAllPorts
            ? `Unrestricted All-Port Internet Ingress (${b.resourceName})`
            : allowsSsh
              ? `Unrestricted Internet SSH Access on Port 22 (${b.resourceName})`
              : `Public 0.0.0.0/0 Ingress Firewall Rule (${b.resourceName})`,
          description: `Firewall rule '${b.address}' permits inbound traffic from 0.0.0.0/0${allowsAllPorts ? ' across all TCP ports (0-65535)' : allowsSsh ? ' on SSH port 22' : ''}, exposing VPC workloads directly to internet scanning and brute-force exploitation.`,
          remediation: 'Restrict source_ranges to Google Identity-Aware Proxy (35.235.240.0/20) or corporate bastion CIDRs, and scope ports strictly to required application protocols.',
          fix: fixedBlock,
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: allowsRdp ? 'CIS 3.7' : 'CIS 3.6',
              description: 'Ensure SSH/administrative ingress access is restricted from the Internet.',
              impact: 'Direct internet-wide attack surface and lateral VPC compromise.'
            },
            {
              standard: 'PCI DSS',
              controlId: 'Req 1.3.1',
              description: 'Inbound traffic to the cardholder data environment is restricted to only necessary traffic.',
              impact: 'Immediate PCI DSS network segmentation non-compliance.'
            },
            {
              standard: 'NIST 800-53',
              controlId: 'SC-7',
              description: 'Boundary Protection — monitor and control communications at external boundaries.',
              impact: 'Unauthorized network perimeter traversal.'
            }
          ]
        });
      }
    }

    // Cloud Storage checks (google_storage_bucket & IAM)
    if (b.resourceType === 'google_storage_bucket') {
      const hasUbla = /uniform_bucket_level_access\s*=\s*true/.test(text);
      const hasPap = /public_access_prevention\s*=\s*"enforced"/.test(text);
      if (!hasUbla || !hasPap) {
        let additions = '';
        if (!hasUbla) additions += 'uniform_bucket_level_access = true\n';
        if (!hasPap) additions += 'public_access_prevention    = "enforced"';
        findings.push({
          id: nextId('det-gcs'),
          severity: Severity.CRITICAL,
          category: 'Security',
          title: `Cloud Storage Bucket Lacks Uniform Access / Public Prevention (${b.resourceName})`,
          description: `Bucket '${b.address}' omits 'uniform_bucket_level_access = true' or 'public_access_prevention = "enforced"', allowing legacy fine-grained object ACLs or accidental public exposure.`,
          remediation: 'Enforce uniform_bucket_level_access = true and public_access_prevention = "enforced" on all GCS buckets.',
          fix: injectAttributeIntoBlock(b.rawText, additions.trim()),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: 'CIS 5.1 / 5.2',
              description: 'Ensure Cloud Storage buckets have uniform bucket-level access and public access prevention enabled.',
              impact: 'High risk of unauthorized public read/write exposure of sensitive objects.'
            },
            {
              standard: 'EU GDPR',
              controlId: 'Art. 32',
              description: 'Security of processing — ensure confidentiality and integrity of personal data.',
              impact: 'Reportable data breach and regulatory fines.'
            }
          ]
        });
      }

      if (!/versioning\s*\{[\s\S]*?enabled\s*=\s*true/.test(text)) {
        findings.push({
          id: nextId('det-gcs-ver'),
          severity: Severity.MEDIUM,
          category: 'Reliability',
          title: `Object Versioning Disabled on Storage Bucket (${b.resourceName})`,
          description: `Bucket '${b.address}' does not enable object versioning, preventing point-in-time recovery from accidental deletion or ransomware overwrite.`,
          remediation: 'Add a versioning { enabled = true } block alongside a lifecycle rule to cap noncurrent version retention.',
          fix: injectAttributeIntoBlock(b.rawText, 'versioning {\n  enabled = true\n}'),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'SOC 2',
              controlId: 'A1.2',
              description: 'Environmental protections, software, data backup processes, and recovery infrastructure.',
              impact: 'Irreversible data loss upon accidental overwrite.'
            }
          ]
        });
      }
    }

    if (
      (b.resourceType === 'google_storage_bucket_iam_binding' ||
        b.resourceType === 'google_storage_bucket_iam_member' ||
        b.resourceType === 'google_cloud_run_service_iam_member') &&
      /(?:allUsers|allAuthenticatedUsers)/.test(text)
    ) {
      findings.push({
        id: nextId('det-iam-pub'),
        severity: Severity.CRITICAL,
        category: 'Security',
        title: `Public IAM Principal (allUsers / allAuthenticatedUsers) Bound on ${b.address}`,
        description: `IAM resource '${b.address}' grants access to 'allUsers' or 'allAuthenticatedUsers', making the target resource publicly accessible to anyone on the internet.`,
        remediation: 'Replace public principals with least-privilege Google service accounts or Google Workspace groups.',
        fix: b.rawText.replace(/allUsers|allAuthenticatedUsers/g, 'group:cloud-ops@example.com'),
        originalSnippet: b.rawText,
        resourceAddress: b.address,
        fileName: b.fileName,
        lineNumber: b.startLine,
        endLineNumber: b.endLine,
        source: 'deterministic',
        compliance: [
          {
            standard: 'CIS GCP Benchmark',
            controlId: 'CIS 5.1',
            description: 'Ensure that Cloud resources are not anonymously or publicly accessible.',
            impact: 'Unauthenticated internet exposure.'
          }
        ]
      });
    }

    // Compute Instance checks (google_compute_instance)
    if (b.resourceType === 'google_compute_instance') {
      if (/access_config\s*\{/.test(text)) {
        const withoutPublicIp = b.rawText.replace(/\s*access_config\s*\{[\s\S]*?\}/g, '');
        findings.push({
          id: nextId('det-vm-ip'),
          severity: Severity.HIGH,
          category: 'Security',
          title: `Public External IP Assigned to Compute VM (${b.resourceName})`,
          description: `Compute instance '${b.address}' defines an 'access_config' block assigning a public external IPv4 address. Direct external IPs increase attack surface and incur external IP charges.`,
          remediation: 'Remove the access_config {} block so the VM uses private RFC 1918 networking, Cloud NAT for egress, and IAP TCP forwarding for SSH.',
          fix: withoutPublicIp,
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          costSavings: 'Save ~$4/mo per static/ephemeral IPv4',
          monthlySavingsUsd: 3.65,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: 'CIS 4.9',
              description: 'Ensure that Compute instances do not have public IP addresses.',
              impact: 'Direct internet reachability bypassing centralized ingress load balancers/WAF.'
            }
          ]
        });
      }

      if (!/shielded_instance_config\s*\{/.test(text)) {
        findings.push({
          id: nextId('det-vm-shield'),
          severity: Severity.MEDIUM,
          category: 'Security',
          title: `Shielded VM Integrity Monitoring Not Enforced (${b.resourceName})`,
          description: `Compute instance '${b.address}' does not explicitly enforce Shielded VM Secure Boot, vTPM, and Integrity Monitoring.`,
          remediation: 'Add a shielded_instance_config block enabling enable_secure_boot, enable_vtpm, and enable_integrity_monitoring.',
          fix: injectAttributeIntoBlock(
            b.rawText,
            'shielded_instance_config {\n  enable_secure_boot          = true\n  enable_vtpm                 = true\n  enable_integrity_monitoring = true\n}'
          ),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: 'CIS 4.8',
              description: 'Ensure Compute instances are launched with Shielded VM enabled.',
              impact: 'Boot-level rootkits or firmware tampering may go undetected.'
            }
          ]
        });
      }

      if (!/service_account\s*\{/.test(text)) {
        findings.push({
          id: nextId('det-vm-sa'),
          severity: Severity.HIGH,
          category: 'Security',
          title: `Compute VM Uses Default Compute Engine Service Account (${b.resourceName})`,
          description: `Compute instance '${b.address}' omits a dedicated 'service_account' block and falls back to the Default Compute Engine Service Account, which often holds broad Editor permissions across the project.`,
          remediation: 'Attach a dedicated, least-privilege custom service account to the VM.',
          fix: injectAttributeIntoBlock(
            b.rawText,
            'service_account {\n  email  = google_service_account.vm_least_priv.email\n  scopes = ["cloud-platform"]\n}'
          ),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: 'CIS 4.1',
              description: 'Ensure that instances are not configured to use the default service account.',
              impact: 'Privilege escalation across project resources if the VM is compromised.'
            },
            {
              standard: 'HIPAA',
              controlId: '164.312(a)(1)',
              description: 'Access Control — grant unique least-privilege identities.',
              impact: 'Excessive blast radius across ePHI workloads.'
            }
          ]
        });
      }

      if (/machine_type\s*=\s*"n1-/.test(text)) {
        findings.push({
          id: nextId('det-vm-gen'),
          severity: Severity.MEDIUM,
          category: 'Performance',
          title: `Legacy First-Generation N1 Machine Family (${b.resourceName})`,
          description: `Compute instance '${b.address}' uses a legacy N1 machine type, delivering worse price-performance than modern E2, N4, or Axion C4A generations.`,
          remediation: 'Migrate from n1-standard-* to e2-standard-* (cost-optimized) or n4-standard-* / c4a-standard-* (high efficiency).',
          fix: b.rawText.replace(/"n1-standard-(\d+)"/g, '"e2-standard-$1"'),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          costSavings: 'Save ~31% ($45/mo)',
          monthlySavingsUsd: 45,
          source: 'deterministic',
          compliance: []
        });
      }
    }

    // Cloud SQL checks (google_sql_database_instance)
    if (b.resourceType === 'google_sql_database_instance') {
      if (/ipv4_enabled\s*=\s*true/.test(text) || /0\.0\.0\.0\/0/.test(text)) {
        findings.push({
          id: nextId('det-sql-ip'),
          severity: Severity.CRITICAL,
          category: 'Security',
          title: `Cloud SQL Public IPv4 / Open Authorized Network (${b.resourceName})`,
          description: `Database instance '${b.address}' enables public IPv4 connectivity or authorizes 0.0.0.0/0, exposing database endpoints outside private VPC boundaries.`,
          remediation: 'Disable public IPv4 (ipv4_enabled = false) and connect via Private Services Access or Private Service Connect.',
          fix: b.rawText.replace(/ipv4_enabled\s*=\s*true/g, 'ipv4_enabled = false'),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'CIS GCP Benchmark',
              controlId: 'CIS 6.6',
              description: 'Ensure Cloud SQL database instances do not have public IPs.',
              impact: 'Direct database exposure to credential stuffing and protocol exploits.'
            },
            {
              standard: 'PCI DSS',
              controlId: 'Req 1.3.2',
              description: 'Prohibit direct public access between the Internet and system components in the CDE.',
              impact: 'Critical cardholder database compliance violation.'
            }
          ]
        });
      }

      if (!/availability_type\s*=\s*"REGIONAL"/.test(text)) {
        findings.push({
          id: nextId('det-sql-ha'),
          severity: Severity.HIGH,
          category: 'Reliability',
          title: `Cloud SQL Single-Zone Deployment Lacks Automatic Failover (${b.resourceName})`,
          description: `Database instance '${b.address}' does not configure 'availability_type = "REGIONAL"', risking prolonged downtime during a zonal outage.`,
          remediation: 'Configure availability_type = "REGIONAL" inside settings {} and enable automated point-in-time recovery backups.',
          fix: injectAttributeIntoBlock(
            b.rawText,
            'settings {\n  availability_type = "REGIONAL"\n  backup_configuration {\n    enabled                        = true\n    point_in_time_recovery_enabled = true\n  }\n}'
          ),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: [
            {
              standard: 'SOC 2',
              controlId: 'A1.2',
              description: 'High availability and automated failover for critical data stores.',
              impact: 'RTO/RPO breach during GCP zone maintenance or failure.'
            }
          ]
        });
      }

      if (/deletion_protection\s*=\s*false/.test(text) || !/deletion_protection\s*=\s*true/.test(text)) {
        findings.push({
          id: nextId('det-sql-del'),
          severity: Severity.MEDIUM,
          category: 'Reliability',
          title: `Cloud SQL Deletion Protection Disabled (${b.resourceName})`,
          description: `Database '${b.address}' lacks 'deletion_protection = true', allowing a single 'terraform destroy' or state refactor to drop the database permanently.`,
          remediation: 'Set deletion_protection = true on stateful database instances.',
          fix: /deletion_protection\s*=\s*false/.test(b.rawText)
            ? b.rawText.replace(/deletion_protection\s*=\s*false/g, 'deletion_protection = true')
            : injectAttributeIntoBlock(b.rawText, 'deletion_protection = true'),
          originalSnippet: b.rawText,
          resourceAddress: b.address,
          fileName: b.fileName,
          lineNumber: b.startLine,
          endLineNumber: b.endLine,
          source: 'deterministic',
          compliance: []
        });
      }
    }

    // Unattached Persistent Disk check (google_compute_disk)
    if (b.resourceType === 'google_compute_disk' && !attachedDiskNames.has(b.resourceName)) {
      findings.push({
        id: nextId('det-disk-zombie'),
        severity: Severity.MEDIUM,
        category: 'Cost Optimization',
        title: `Unattached Persistent Disk Incurring Idle Cost (${b.resourceName})`,
        description: `Persistent disk '${b.address}' is provisioned without any referencing Compute instance or attachment resource in the configuration.`,
        remediation: 'Snapshot and delete unused disks, attach the disk to a VM, or downgrade archive storage to Cloud Storage Coldline.',
        fix: b.rawText.replace(/"pd-ssd"/g, '"pd-standard"'),
        originalSnippet: b.rawText,
        resourceAddress: b.address,
        fileName: b.fileName,
        lineNumber: b.startLine,
        endLineNumber: b.endLine,
        costSavings: 'Save ~$50/mo',
        monthlySavingsUsd: 50,
        source: 'deterministic',
        compliance: []
      });
    }

    // Operational Excellence: Missing governance labels on taggable GCP resources
    const labelableResources = new Set([
      'google_compute_instance',
      'google_storage_bucket',
      'google_compute_disk',
      'google_container_cluster',
      'google_cloud_run_v2_service'
    ]);
    if (labelableResources.has(b.resourceType) && !/\blabels\s*=/.test(text)) {
      findings.push({
        id: nextId('det-ops-lbl'),
        severity: Severity.LOW,
        category: 'Operational Excellence',
        title: `Missing FinOps & Governance Labels (${b.address})`,
        description: `Resource '${b.address}' lacks a 'labels' map (e.g., environment, owner, cost_center), hindering cost allocation, automated scheduling, and incident ownership.`,
        remediation: 'Attach standardized labels (environment, owner, cost_center, managed_by = "terraform").',
        fix: injectAttributeIntoBlock(
          b.rawText,
          'labels = {\n  environment = "production"\n  owner       = "platform-engineering"\n  cost_center = "cloud-infra"\n  managed_by  = "terraform"\n}'
        ),
        originalSnippet: b.rawText,
        resourceAddress: b.address,
        fileName: b.fileName,
        lineNumber: b.startLine,
        endLineNumber: b.endLine,
        source: 'deterministic',
        compliance: []
      });
    }
  }

  // --- 2. Evaluate Terraform Plan JSON (`tfplan.json`) ---
  for (const file of files) {
    if (!file.fileName.toLowerCase().endsWith('.json')) continue;
    try {
      const plan = JSON.parse(file.content);
      if (Array.isArray(plan?.resource_changes)) {
        for (const rc of plan.resource_changes) {
          const actions: string[] = rc?.change?.actions || [];
          if (actions.includes('delete') && !actions.includes('create')) {
            continue;
          }
          const after = rc?.change?.after;
          if (!after) continue;
          const address = rc.address || `${rc.type}.${rc.name}`;

          if (rc.type === 'google_compute_firewall' && Array.isArray(after.source_ranges) && after.source_ranges.includes('0.0.0.0/0')) {
            findings.push({
              id: nextId('det-plan-fw'),
              severity: Severity.CRITICAL,
              category: 'Security',
              title: `Planned Open 0.0.0.0/0 Firewall Rule (${address})`,
              description: `Terraform plan creates/updates '${address}' with source_ranges including 0.0.0.0/0.`,
              remediation: 'Restrict source_ranges to Google IAP (35.235.240.0/20) or internal CIDR ranges before applying the plan.',
              fix: `resource "google_compute_firewall" "${rc.name || 'restricted'}" {\n  source_ranges = ["35.235.240.0/20"]\n}`,
              resourceAddress: address,
              fileName: file.fileName,
              lineNumber: 1,
              source: 'deterministic',
              compliance: [
                {
                  standard: 'CIS GCP Benchmark',
                  controlId: 'CIS 3.6',
                  description: 'Restrict internet ingress on VPC firewall rules.',
                  impact: 'Internet-wide network exposure.'
                }
              ]
            });
          }

          if (rc.type === 'google_storage_bucket' && after.uniform_bucket_level_access !== true) {
            findings.push({
              id: nextId('det-plan-gcs'),
              severity: Severity.CRITICAL,
              category: 'Security',
              title: `Planned GCS Bucket Without Uniform Access (${address})`,
              description: `Terraform plan provisions '${address}' with uniform_bucket_level_access = false.`,
              remediation: 'Enable uniform_bucket_level_access = true and public_access_prevention = "enforced".',
              fix: `resource "google_storage_bucket" "${rc.name || 'secure_bucket'}" {\n  uniform_bucket_level_access = true\n  public_access_prevention    = "enforced"\n}`,
              resourceAddress: address,
              fileName: file.fileName,
              lineNumber: 1,
              source: 'deterministic',
              compliance: [
                {
                  standard: 'CIS GCP Benchmark',
                  controlId: 'CIS 5.1',
                  description: 'Ensure Cloud Storage buckets have uniform bucket-level access enabled.',
                  impact: 'Legacy ACL drift and public object exposure.'
                }
              ]
            });
          }
        }
      }
    } catch {
      // Ignore malformed JSON during static pre-pass
    }
  }

  // --- 3. Multi-Stack Support: Kubernetes / GKE / Config Connector YAML ---
  for (const file of files) {
    const lower = file.fileName.toLowerCase();
    if (!lower.endsWith('.yaml') && !lower.endsWith('.yml')) continue;
    // Skip .dra.yaml policy files
    if (lower.includes('dra.yaml') || lower.includes('dra.yml')) continue;

    try {
      const docs = yaml.loadAll(file.content) as any[];
      for (const doc of docs) {
        if (!doc || typeof doc !== 'object' || !doc.kind) continue;
        const kind = String(doc.kind);
        const metaName = doc.metadata?.name || 'unnamed';
        const podSpec = doc.spec?.template?.spec || (kind === 'Pod' ? doc.spec : null);

        if (podSpec && Array.isArray(podSpec.containers)) {
          for (const c of podSpec.containers) {
            if (c?.securityContext?.privileged === true) {
              findings.push({
                id: nextId('det-k8s-priv'),
                severity: Severity.CRITICAL,
                category: 'Security',
                title: `Privileged Container in ${kind}/${metaName} (${c.name})`,
                description: `Container '${c.name}' in ${kind} '${metaName}' sets 'securityContext.privileged: true', granting full host kernel/node capabilities on GKE.`,
                remediation: 'Set privileged: false, allowPrivilegeEscalation: false, and runAsNonRoot: true.',
                fix: `securityContext:\n  privileged: false\n  allowPrivilegeEscalation: false\n  runAsNonRoot: true`,
                resourceAddress: `${kind}/${metaName}`,
                fileName: file.fileName,
                lineNumber: 1,
                source: 'deterministic',
                compliance: [
                  {
                    standard: 'CIS GCP Benchmark',
                    controlId: 'CIS GKE 5.2.1',
                    description: 'Minimize the admission of privileged containers.',
                    impact: 'Container escape to underlying GKE worker node.'
                  }
                ]
              });
            }
            if (!c?.resources?.limits) {
              findings.push({
                id: nextId('det-k8s-res'),
                severity: Severity.MEDIUM,
                category: 'Reliability',
                title: `Missing CPU/Memory Limits in ${kind}/${metaName} (${c.name})`,
                description: `Container '${c.name}' omits 'resources.limits', risking noisy-neighbor node exhaustion and OOM cascades.`,
                remediation: 'Define explicit CPU and memory requests and limits for GKE Autopilot/Standard predictability.',
                fix: `resources:\n  requests:\n    cpu: "250m"\n    memory: "256Mi"\n  limits:\n    cpu: "500m"\n    memory: "512Mi"`,
                resourceAddress: `${kind}/${metaName}`,
                fileName: file.fileName,
                lineNumber: 1,
                source: 'deterministic',
                compliance: []
              });
            }
          }
        }
      }
    } catch {
      // Ignore non-K8s YAML syntax errors
    }
  }

  // --- 4. Multi-Stack Support: Dockerfile ---
  for (const file of files) {
    const isDocker =
      file.fileName.toLowerCase().includes('dockerfile') ||
      /^\s*FROM\s+\S+/m.test(file.content);
    if (!isDocker) continue;

    if (!/^\s*USER\s+(?!root\b)\S+/m.test(file.content)) {
      findings.push({
        id: nextId('det-docker-user'),
        severity: Severity.HIGH,
        category: 'Security',
        title: `Container Runs as Root User (${file.fileName})`,
        description: `Dockerfile '${file.fileName}' does not switch to a non-root 'USER', causing container processes on Cloud Run or GKE to execute with UID 0.`,
        remediation: 'Add a non-root USER instruction (e.g. USER node or USER 65532:65532) before CMD/ENTRYPOINT.',
        fix: `USER node`,
        resourceAddress: `Dockerfile.${file.fileName}`,
        fileName: file.fileName,
        lineNumber: file.content.split('\n').length,
        source: 'deterministic',
        compliance: [
          {
            standard: 'NIST 800-53',
            controlId: 'AC-6',
            description: 'Least Privilege — execute container processes with non-privileged user accounts.',
            impact: 'Elevated impact of container runtime vulnerabilities.'
          }
        ]
      });
    }
  }

  // --- 5. Compute Baseline Pillar Scores ---
  const pillarNames = [
    'Security & Compliance',
    'Cost Optimization',
    'Reliability',
    'Operational Excellence',
    'Performance Efficiency'
  ];

  const mapCategoryToPillar = (cat: string): string => {
    const c = cat.toLowerCase();
    if (c.includes('sec')) return 'Security & Compliance';
    if (c.includes('cost') || c.includes('finops')) return 'Cost Optimization';
    if (c.includes('reliab')) return 'Reliability';
    if (c.includes('perf')) return 'Performance Efficiency';
    return 'Operational Excellence';
  };

  const baselineCategories: CategoryScore[] = pillarNames.map((pillar) => {
    const relevant = findings.filter((f) => mapCategoryToPillar(f.category) === pillar);
    let penalty = 0;
    let hasCrit = false;
    let hasHighOrMed = false;

    for (const f of relevant) {
      if (f.severity === Severity.CRITICAL) {
        penalty += 28;
        hasCrit = true;
      } else if (f.severity === Severity.HIGH) {
        penalty += 16;
        hasHighOrMed = true;
      } else if (f.severity === Severity.MEDIUM) {
        penalty += 10;
        hasHighOrMed = true;
      } else if (f.severity === Severity.LOW) {
        penalty += 5;
      }
    }

    const score = Math.max(15, 100 - penalty);
    const status: 'Safe' | 'Warning' | 'Critical' =
      hasCrit || score < 55 ? 'Critical' : hasHighOrMed || score < 80 ? 'Warning' : 'Safe';

    const explanation =
      relevant.length === 0
        ? `No deterministic ${pillar.toLowerCase()} violations detected in static AST scan.`
        : `Identified ${relevant.length} static violation(s): ${relevant
            .slice(0, 2)
            .map((r) => r.title)
            .join('; ')}.`;

    return { name: pillar, score, status, explanation };
  });

  // --- 6. Build Deterministic Mermaid Topology Diagram ---
  const resourceBlocks = blocks.filter((b) => b.blockType === 'resource');
  let fallbackDiagram = 'flowchart TD\n';
  if (resourceBlocks.length > 0) {
    fallbackDiagram += '  Internet["Public Internet (0.0.0.0/0)"]\n';
    fallbackDiagram += '  subgraph GCP["Google Cloud Platform Scope"]\n';
    resourceBlocks.slice(0, 18).forEach((rb, idx) => {
      const nodeId = `R${idx + 1}`;
      const safeLabel = `${rb.resourceType.replace('google_', '')}: ${rb.resourceName}`.replace(/["[\]<>]/g, '');
      fallbackDiagram += `    ${nodeId}["${safeLabel}"]\n`;
    });
    fallbackDiagram += '  end\n';

    resourceBlocks.slice(0, 18).forEach((rb, idx) => {
      const nodeId = `R${idx + 1}`;
      const hasCrit = findings.some((f) => f.resourceAddress === rb.address && f.severity === Severity.CRITICAL);
      if (rb.resourceType === 'google_compute_firewall' && /0\.0\.0\.0\/0/.test(rb.rawText)) {
        fallbackDiagram += `  Internet -->|Unrestricted Ingress| ${nodeId}\n`;
      }
      // Link references between resources
      resourceBlocks.slice(0, 18).forEach((other, oIdx) => {
        if (idx !== oIdx && (rb.rawText.includes(other.resourceName) || rb.rawText.includes(other.address))) {
          fallbackDiagram += `  R${oIdx + 1} --> ${nodeId}\n`;
        }
      });
      if (hasCrit) {
        fallbackDiagram += `  style ${nodeId} fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b\n`;
      }
    });
  } else {
    fallbackDiagram += '  Spec["Audited IaC Specification"] --> Gate["DRA Deterministic Engine"]\n';
  }

  return {
    findings,
    blocks,
    detectedRegion,
    baselineCategories,
    fallbackDiagram
  };
};
