import { AuditResult, GEMINI_MODEL, Severity } from '../types';

export const MOCK_AUDIT_RESULT: AuditResult = {
  summary:
    "Hybrid AST + AI evaluation of 'Project-Aegis' shows solid multi-zone reliability (88/100) alongside two critical security blockers (public Cloud Storage bucket without UBLA and open SSH firewall) and $124.08/mo in reclaimable GCP FinOps spend.",
  model: GEMINI_MODEL,
  provider: 'gemini',
  staticFindingsCount: 4,
  aiFindingsCount: 2,
  categories: [
    {
      name: 'Security & Compliance',
      score: 42,
      status: 'Critical',
      explanation:
        'Public-facing storage buckets and wide-open ingress rules (0.0.0.0/0) on port 22 violate CIS GCP v2.0 3.6, 5.1, and NIST AC-3/SC-7 controls.'
    },
    {
      name: 'Cost Optimization',
      score: 65,
      status: 'Warning',
      explanation:
        'Legacy N1 machine family and an unattached 500 GB PD-SSD volume incur $124.08/mo in avoidable waste.'
    },
    {
      name: 'Reliability',
      score: 88,
      status: 'Safe',
      explanation:
        'Strong multi-zonal distribution for compute instances; add object versioning on state-critical buckets.'
    },
    {
      name: 'Operational Excellence',
      score: 72,
      status: 'Warning',
      explanation:
        'Terraform IaC structure is clean, but FinOps attribution labels (environment, owner, cost_center) are missing.'
    },
    {
      name: 'Performance Efficiency',
      score: 95,
      status: 'Safe',
      explanation:
        'Network tiering and Hyperdisk/SSD storage choices match low-latency workload requirements.'
    }
  ],
  finops: {
    region: 'us-central1',
    estimatedCurrentMonthlyUsd: 227.35,
    estimatedOptimizedMonthlyUsd: 103.27,
    potentialMonthlySavingsUsd: 124.08,
    annualSavingsUsd: 1488.96,
    lineItems: [
      {
        resourceAddress: 'google_compute_instance.admin_box',
        resourceType: 'google_compute_instance',
        skuDescription: 'Compute VM (n1-standard-4 + External IPv4)',
        region: 'us-central1',
        count: 1,
        currentMonthlyUsd: 142.35,
        optimizedMonthlyUsd: 93.27,
        savingsMonthlyUsd: 49.08,
        recommendation: 'Migrate legacy N1 to e2-standard-4 / c4a-standard-4 and remove public IPv4.',
        fileName: 'main.tf',
        lineNumber: 8
      },
      {
        resourceAddress: 'google_compute_disk.unused_disk_backup',
        resourceType: 'google_compute_disk',
        skuDescription: 'Persistent Disk (pd-ssd, 500 GB, Unattached)',
        region: 'us-central1',
        count: 1,
        currentMonthlyUsd: 85.0,
        optimizedMonthlyUsd: 10.0,
        savingsMonthlyUsd: 75.0,
        recommendation: 'Unattached zombie disk — snapshot ($0.026/GB) and delete volume.',
        fileName: 'main.tf',
        lineNumber: 41
      }
    ]
  },
  findings: [
    {
      id: 'f1',
      severity: Severity.CRITICAL,
      category: 'Security',
      title: 'Publicly Accessible Object Storage',
      description:
        "The bucket 'corp-data-prod' has 'uniform_bucket_level_access' disabled and lacks 'public_access_prevention'. This exposes sensitive data to accidental ACL drift.",
      remediation:
        "Enable Uniform Bucket Level Access and set public_access_prevention to 'enforced'.",
      fix: 'resource "google_storage_bucket" "corporate_data" {\n  name                        = "corp-data-prod"\n  location                    = "US"\n  uniform_bucket_level_access = true\n  public_access_prevention    = "enforced"\n}',
      fileName: 'main.tf',
      lineNumber: 2,
      source: 'hybrid',
      compliance: [
        {
          standard: 'CIS GCP Benchmark',
          controlId: 'CIS 5.1',
          description: 'Ensure that Cloud Storage buckets have uniform bucket-level access enabled.',
          impact:
            'Disabling this allows individual objects to have legacy ACLs, increasing the risk of public data exposure.'
        },
        {
          standard: 'EU GDPR',
          controlId: 'Art. 32',
          description: 'Security of processing and confidentiality of stored data.',
          impact: 'Unauthorized public read access to regulated records.'
        }
      ]
    },
    {
      id: 'f2',
      severity: Severity.HIGH,
      category: 'Security',
      title: 'Over-Permissive Firewall Rules (SSH 0.0.0.0/0)',
      description:
        "Firewall rule 'allow-all-ingress' allows TCP traffic on port 22 from all IP addresses (0.0.0.0/0).",
      remediation:
        'Restrict SSH access to Identity-Aware Proxy (35.235.240.0/20) and eliminate public VM IPs.',
      fix: 'resource "google_compute_firewall" "restrict_ssh" {\n  name    = "allow-ssh-iap"\n  network = "default"\n  allow {\n    protocol = "tcp"\n    ports    = ["22"]\n  }\n  source_ranges = ["35.235.240.0/20"]\n}',
      fileName: 'main.tf',
      lineNumber: 14,
      source: 'deterministic',
      compliance: [
        {
          standard: 'CIS GCP Benchmark',
          controlId: 'CIS 3.6',
          description: 'Ensure that SSH access is restricted from the Internet.',
          impact: 'Internet-wide brute-force and lateral VPC compromise.'
        },
        {
          standard: 'NIST 800-53',
          controlId: 'AC-17',
          description: 'Remote Access enforcement.',
          impact: 'Unauthenticated perimeter exposure.'
        }
      ]
    },
    {
      id: 'f3',
      severity: Severity.MEDIUM,
      category: 'Cost Optimization',
      title: 'Unattached 500 GB PD-SSD Zombie Disk',
      description:
        "Disk 'unused-disk-backup' is provisioned as PD-SSD ($85/mo) without any attached Compute VM.",
      remediation: 'Archive via snapshot ($13/mo) and remove unattached block volume.',
      costSavings: 'Save ~$75/mo',
      monthlySavingsUsd: 75,
      fix: 'resource "google_compute_disk" "unused_disk_backup" {\n  name = "unused-disk-backup"\n  type = "pd-standard"\n  zone = "us-central1-a"\n  size = 500\n}',
      fileName: 'main.tf',
      lineNumber: 41,
      source: 'deterministic'
    },
    {
      id: 'f4',
      severity: Severity.LOW,
      category: 'Operational Excellence',
      title: 'Missing Governance & FinOps Labels',
      description:
        'Compute instances and storage buckets lack standardized environment, owner, and cost_center labels.',
      remediation: 'Apply organization-wide labeling conventions across all taggable resources.',
      fix: 'labels = {\n  environment = "prod"\n  owner       = "platform-team"\n  cost_center = "audit-101"\n}',
      fileName: 'main.tf',
      lineNumber: 26,
      source: 'deterministic'
    }
  ],
  diagram: `flowchart TD
  subgraph Internet["Public Internet"]
    User["Untrusted Traffic (0.0.0.0/0)"]
  end

  subgraph GCP["Google Cloud Project: Project-Aegis"]
    subgraph VPC["VPC: prod-secure-vpc"]
      FW["Firewall: allow_ssh (Port 22 open)"]
      VM["Compute VM: admin-box (n1-standard-4)"]
      Disk["PD-SSD Disk: unused-disk-backup (Unattached)"]
    end

    subgraph Storage["Cloud Storage"]
      Bucket["Bucket: corp-data-prod (No UBLA)"]
    end
  end

  User -->|Insecure SSH| FW
  FW --> VM
  User -->|Public ACL Risk| Bucket
  VM -.->|Detached| Disk

  style FW fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
  style Bucket fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
  style Disk fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e`,
  usage: {
    promptTokenCount: 1450,
    candidatesTokenCount: 890,
    totalTokenCount: 2340
  }
};
