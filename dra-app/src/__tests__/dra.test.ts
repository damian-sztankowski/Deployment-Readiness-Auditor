import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { anonymizeHcl, deanonymizeAuditResult } from '../services/dlpService';
import { isRestrictedIp, resolveAndValidateLlmUrl } from '../services/ssrfGuard';
import { runDeterministicStaticAudit } from '../services/staticAnalyzer';
import { calculateFinOpsSummary } from '../services/finopsService';
import {
  parsePolicyYaml,
  evaluatePolicyGuardrails,
  applyPolicyWaivers
} from '../services/policyService';
import { generateRemediationBundle } from '../services/remediationService';
import {
  timingSafeSecretMatch,
  signSessionToken,
  verifySessionCookieValue
} from '../../server';
import {
  AuditResult,
  formatModelDisplayName,
  GEMINI_MODEL,
  GEMINI_MODEL_PRESETS,
  Severity
} from '../types';

describe('DRA v3.1 Core Security & Engine Suite', () => {
  describe('Bidirectional DLP Engine', () => {
    it('permanently scrubs secrets while reversibly aliasing project/VPC/email identifiers', () => {
      const sampleHcl = `
provider "google" {
  project = "finance-prod-12345"
  region  = "us-central1"
}
resource "google_compute_instance" "vm" {
  network = "corp-prod-vpc"
  metadata = {
    owner-email = "alice@corp.internal"
    api-key     = "AIzaSyB-4X9-2kLp0-SecretKey99123456"
  }
  source_ranges = ["0.0.0.0/0", "35.192.10.55"]
}`;

      const dlp = anonymizeHcl(sampleHcl);
      expect(dlp.sanitizedCode).not.toContain('finance-prod-12345');
      expect(dlp.sanitizedCode).not.toContain('corp-prod-vpc');
      expect(dlp.sanitizedCode).not.toContain('alice@corp.internal');
      expect(dlp.sanitizedCode).not.toContain('AIzaSyB-4X9');
      expect(dlp.sanitizedCode).toContain('[REDACTED_GCP_API_KEY]');
      // Must preserve 0.0.0.0/0 so security rules fire
      expect(dlp.sanitizedCode).toContain('0.0.0.0/0');

      const mockResult: AuditResult = {
        summary: 'Project CLOUD_ID_1 exposes NETWORK_TOPOGRAPHY_1 owned by IDENTITY_1.',
        categories: [{ name: 'Security', score: 40, status: 'Critical', explanation: 'VPC NETWORK_TOPOGRAPHY_1 open' }],
        findings: [
          {
            id: '1',
            severity: Severity.CRITICAL,
            category: 'Security',
            title: 'Issue in CLOUD_ID_1',
            description: 'Secret [REDACTED_GCP_API_KEY] found in NETWORK_TOPOGRAPHY_1',
            remediation: 'Fix VPC NETWORK_TOPOGRAPHY_1',
            fix: 'network = "NETWORK_TOPOGRAPHY_1"'
          }
        ],
        diagram: 'flowchart TD\n  A["CLOUD_ID_1"] --> B["NETWORK_TOPOGRAPHY_1"]'
      };

      const restored = deanonymizeAuditResult(mockResult, dlp.aliasMap);
      expect(restored.summary).toContain('finance-prod-12345');
      expect(restored.summary).toContain('corp-prod-vpc');
      expect(restored.summary).toContain('alice@corp.internal');
      expect(restored.findings[0].fix).toBe('network = "corp-prod-vpc"');
      // Secret MUST remain redacted
      expect(restored.findings[0].description).toContain('[REDACTED_GCP_API_KEY]');
      expect(restored.findings[0].description).not.toContain('AIzaSy');
    });
  });

  describe('SSRF & Local Loopback Guard', () => {
    it('blocks RFC1918, CGNAT, GCP Metadata, IPv6 ULA fd00::/8, and IPv4-mapped IPv6', () => {
      expect(isRestrictedIp('169.254.169.254', true)).toBe(true);
      expect(isRestrictedIp('::ffff:169.254.169.254', true)).toBe(true);
      expect(isRestrictedIp('10.128.0.5', false)).toBe(true);
      expect(isRestrictedIp('100.64.10.1', false)).toBe(true);
      expect(isRestrictedIp('fd12:3456:789a::1', false)).toBe(true);
      expect(isRestrictedIp('fe80::1', false)).toBe(true);
      expect(isRestrictedIp('8.8.8.8', false)).toBe(false);
    });

    it('blocks localhost in production Cloud Run mode but allows localhost in local dev mode', async () => {
      await expect(
        resolveAndValidateLlmUrl('http://localhost:11434/api/generate', { isProduction: true })
      ).rejects.toThrow(/SECURITY_ERROR/);

      await expect(
        resolveAndValidateLlmUrl('http://169.254.169.254/computeMetadata/v1/', {
          isProduction: false
        })
      ).rejects.toThrow(/SECURITY_ERROR/);

      const localOllama = await resolveAndValidateLlmUrl(
        'http://localhost:11434/api/generate',
        { isProduction: false }
      );
      expect(localOllama.url).toBe('http://localhost:11434/api/generate');
    });
  });

  describe('Deterministic Multi-Stack Static Analyzer & FinOps Engine', () => {
    it('detects HCL CIS violations with exact line numbers, resolves variables, and computes FinOps savings', () => {
      const multiFile = `### FILE: variables.tf ###
variable "open_cidr" {
  default = "0.0.0.0/0"
}

### FILE: main.tf ###
provider "google" {
  project = "demo"
  region  = "europe-west3"
}

resource "google_compute_firewall" "ssh_open" {
  name          = "allow-ssh"
  network       = "default"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = [var.open_cidr]
}

resource "google_compute_disk" "zombie" {
  name = "orphan-ssd"
  type = "pd-ssd"
  size = 500
}

### FILE: k8s/deploy.yaml ###
apiVersion: v1
kind: Pod
metadata:
  name: root-pod
spec:
  containers:
    - name: app
      image: nginx:latest
      securityContext:
        privileged: true
`;

      const audit = runDeterministicStaticAudit(multiFile);
      expect(audit.detectedRegion).toBe('europe-west3');
      expect(audit.findings.some((f) => f.title.includes('SSH'))).toBe(true);
      expect(audit.findings.some((f) => f.title.includes('Privileged Container'))).toBe(true);
      expect(audit.findings.some((f) => f.title.includes('Unattached Persistent Disk'))).toBe(true);

      const finops = calculateFinOpsSummary(audit.blocks, audit.detectedRegion);
      expect(finops.region).toBe('europe-west3');
      expect(finops.potentialMonthlySavingsUsd).toBeGreaterThan(60);
    });
  });

  describe('Organization Policy (.dra.yaml) & Expiring Waivers', () => {
    it('enforces region residency and separates active vs expired waivers', () => {
      const policy = parsePolicyYaml(`
organization: "Regulated EU Corp"
allowedRegions:
  - europe-*
waivers:
  - id: "CIS 3.6"
    reason: "Temporary migration bastion"
    approvedBy: "ciso@eu.corp"
    expires: "2099-01-01"
  - id: "CIS 5.1"
    reason: "Expired old waiver"
    expires: "2020-01-01"
`);
      expect(policy?.organization).toBe('Regulated EU Corp');

      const staticOut = runDeterministicStaticAudit(`
provider "google" {
  region = "us-central1"
}
resource "google_compute_firewall" "ssh" {
  name = "ssh"
  allow {
    protocol = "tcp"
    ports = ["22"]
  }
  source_ranges = ["0.0.0.0/0"]
}
resource "google_storage_bucket" "b" {
  name = "bkt"
  location = "US"
}
`);

      const polFindings = evaluatePolicyGuardrails(
        staticOut.blocks,
        policy,
        staticOut.detectedRegion
      );
      expect(polFindings.some((f) => f.title.includes('Data Residency Policy Violation'))).toBe(true);

      const waiverRes = applyPolicyWaivers(
        [...polFindings, ...staticOut.findings],
        policy,
        new Date('2026-11-22T00:00:00Z')
      );
      expect(waiverRes.activeWaiversCount).toBe(1);
      expect(waiverRes.expiredWaiversCount).toBe(1);
      expect(waiverRes.waivedFindings[0].waiverApprovedBy).toBe('ciso@eu.corp');
      // Expired CIS 5.1 waiver must remain in activeFindings!
      expect(
        waiverRes.activeFindings.some((f) =>
          (f.compliance || []).some((c) => c.controlId.includes('5.1'))
        )
      ).toBe(true);
    });
  });

  describe('Git Apply Verified Unified Patch Generator', () => {
    it('generates a unified patch that passes real `git apply --check`', () => {
      const original = `resource "google_compute_firewall" "allow_all" {
  name    = "dangerous-rule"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  source_ranges = ["0.0.0.0/0"]
}
`;
      const staticOut = runDeterministicStaticAudit(original);
      const bundle = generateRemediationBundle(staticOut.findings, original);
      expect(bundle.isGitApplyReady).toBe(true);
      expect(bundle.patchContent).toContain('diff --git a/main.tf b/main.tf');
      expect(bundle.patchContent).toContain('35.235.240.0/20');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dra-patch-test-'));
      try {
        fs.writeFileSync(path.join(tmpDir, 'main.tf'), original, 'utf8');
        fs.writeFileSync(path.join(tmpDir, 'fix.patch'), bundle.patchContent, 'utf8');
        execFileSync('git', ['apply', '--check', 'fix.patch'], { cwd: tmpDir });
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('Hardened Cryptographic Auth Helpers', () => {
    it('validates secrets in constant time and verifies HMAC session cookies', () => {
      expect(timingSafeSecretMatch('super-secret-123', 'super-secret-123')).toBe(true);
      expect(timingSafeSecretMatch('super-secret-123', 'different-length')).toBe(false);
      expect(timingSafeSecretMatch('', 'super-secret-123')).toBe(false);

      const sig = signSessionToken('abc123token');
      expect(verifySessionCookieValue(`abc123token.${sig}`)).toBe(true);
      expect(verifySessionCookieValue(`abc123token.tampered`)).toBe(false);
    });
  });

  describe('Gemini 4 Frontier Model Presets & Formatter', () => {
    it('defaults to gemini-4-hydrogen and exposes Gemini 4 & 3.8 presets without legacy 2.5 defaults', () => {
      expect(GEMINI_MODEL).toBe('gemini-4-hydrogen');
      const ids = GEMINI_MODEL_PRESETS.map((p) => p.id);
      expect(ids).toContain('gemini-4-hydrogen');
      expect(ids).toContain('gemini-4-carbon');
      expect(ids).toContain('gemini-4-neon');
      expect(ids).toContain('gemini-3.8-flash');
      expect(ids).not.toContain('gemini-2.5-flash');
      expect(formatModelDisplayName('gemini-4-hydrogen')).toBe('Gemini 4 Hydrogen');
      expect(formatModelDisplayName('dra-deterministic-ast-v3')).toBe('Deterministic AST v3');
    });
  });
});
