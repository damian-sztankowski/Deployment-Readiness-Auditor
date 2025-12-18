export enum Severity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  INFO = 'Info'
}

export interface CategoryScore {
  name: string;
  score: number;
  status: 'Safe' | 'Warning' | 'Critical';
  explanation?: string; // AI reasoning for this specific score
}

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  remediation: string;
  fix?: string; // Terraform/Code snippet to resolve the issue
  compliance?: string[]; // e.g., ["CIS 1.2", "NIST 800-53 SC-7"]
  documentationUrls?: string[]; // Official documentation links (e.g. cloud.google.com)
  complianceUrls?: string[]; // New: Official regulatory/benchmark links (e.g. nist.gov, cisecurity.org, etc.)
  lineNumber?: number;
  fileName?: string;
  costSavings?: string; // e.g., "Save ~20% ($50/mo)"
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface AuditResult {
  summary: string;
  categories: CategoryScore[];
  findings: Finding[];
  usage?: UsageMetadata;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AuditResult | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  summary: string;
  result: AuditResult;
}