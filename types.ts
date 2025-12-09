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
}

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  remediation: string;
  compliance?: string[]; // e.g., ["CIS 1.2", "NIST 800-53 SC-7"]
}

export interface AuditResult {
  overallScore: number;
  summary: string;
  categories: CategoryScore[];
  findings: Finding[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AuditResult | null;
}