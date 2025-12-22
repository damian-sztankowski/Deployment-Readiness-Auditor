import { AuditResult, Severity } from "../types";

export const MOCK_AUDIT_RESULT: AuditResult = {
  summary: "The infrastructure specification for 'Project-Aegis' shows high architectural maturity but contains two critical security violations and significant cost optimization opportunities. The design adheres to 78% of the Google Cloud Well-Architected Framework requirements.",
  categories: [
    {
      name: "Security & Compliance",
      score: 42,
      status: "Critical",
      explanation: "Presence of public-facing storage buckets and wide-open ingress rules (0.0.0.0/0) on port 22 violates the 'Least Privilege' and 'Defense in Depth' pillars. CIS 1.2 and NIST AC-3 controls are non-compliant."
    },
    {
      name: "Cost Optimization",
      score: 65,
      status: "Warning",
      explanation: "Use of legacy N1 machine types and unattached high-performance disks indicates 'FinOps' waste. Transitioning to E2/Tau T2D and implementing lifecycle policies would reclaim ~24% of monthly spend."
    },
    {
      name: "Reliability",
      score: 88,
      status: "Safe",
      explanation: "Excellent multi-zonal distribution for compute instances. Versioning is enabled on most state-critical buckets, though the 'corporate-data' bucket lacks cross-region replication."
    },
    {
      name: "Operational Excellence",
      score: 72,
      status: "Warning",
      explanation: "Deployment automation is evident via Terraform, but resource labeling ('metadata') is inconsistent, complicating billing attribution and automated lifecycle management."
    },
    {
      name: "Performance Efficiency",
      score: 95,
      status: "Safe",
      explanation: "Selected PD-SSD disks and premium network tiers align with high-performance requirements for the legacy application layer."
    }
  ],
  findings: [
    {
      id: "f1",
      severity: Severity.CRITICAL,
      category: "Security",
      title: "Publicly Accessible Object Storage",
      description: "The bucket 'corp-data-prod' has 'uniform_bucket_level_access' disabled and lacks 'public_access_prevention'. This exposes sensitive data to the public internet.",
      remediation: "Enable Uniform Bucket Level Access and set public access prevention to 'enforced'.",
      fix: "resource \"google_storage_bucket\" \"corporate_data\" {\n  name                        = \"corp-data-prod\"\n  location                    = \"US\"\n  uniform_bucket_level_access = true\n  public_access_prevention    = \"enforced\"\n}",
      fileName: "main.tf",
      lineNumber: 2,
      compliance: [
        {
          standard: "CIS GCP Benchmark",
          controlId: "5.1",
          description: "Ensure that Cloud Storage buckets have uniform bucket-level access enabled.",
          impact: "Disabling this allows individual objects to have ACLs, increasing the risk of accidental public data exposure."
        }
      ]
    },
    {
      id: "f2",
      severity: Severity.HIGH,
      category: "Security",
      title: "Over-permissive Firewall Rules (SSH)",
      description: "Firewall rule 'allow-all-ingress' allows TCP traffic on port 22 from all IP addresses (0.0.0.0/0).",
      remediation: "Restrict SSH access to specific administrative IP ranges or use Identity-Aware Proxy (IAP).",
      fix: "resource \"google_compute_firewall\" \"restrict_ssh\" {\n  name    = \"allow-ssh-iap\"\n  network = \"default\"\n  allow {\n    protocol = \"tcp\"\n    ports    = [\"22\"]\n  }\n  source_ranges = [\"35.235.240.0/20\"] # Google IAP Range\n}",
      fileName: "main.tf",
      lineNumber: 14,
      compliance: [
        {
          standard: "NIST 800-53",
          controlId: "AC-17",
          description: "Remote Access",
          impact: "Exposing SSH to the entire internet allows for brute-force attacks and unauthorized access attempts."
        }
      ]
    },
    {
      id: "f3",
      severity: Severity.MEDIUM,
      category: "Cost Optimization",
      title: "Zombie Disk Identified",
      description: "Disk 'unused-disk-backup' is defined as PD-SSD but is not attached to any compute instance, incurring unnecessary costs.",
      remediation: "Convert to standard HDD or delete if no longer required.",
      costSavings: "Save ~$50/mo",
      fix: "resource \"google_compute_disk\" \"unused_disk_backup\" {\n  name = \"unused-disk-backup\"\n  type = \"pd-standard\"\n  zone = \"us-central1-a\"\n  size = 500\n}",
      fileName: "main.tf",
      lineNumber: 41
    },
    {
      id: "f4",
      severity: Severity.LOW,
      category: "Operations",
      title: "Missing Resource Labels",
      description: "Compute instances and storage buckets lack labels for environment, owner, and cost-center tracking.",
      remediation: "Apply a standard labeling schema to all resources.",
      fix: "labels = {\n  environment = \"prod\"\n  owner       = \"platform-team\"\n  cost_center = \"audit-101\"\n}",
      fileName: "main.tf",
      lineNumber: 26
    }
  ],
  usage: {
    promptTokenCount: 1450,
    candidatesTokenCount: 890,
    totalTokenCount: 2340
  }
};