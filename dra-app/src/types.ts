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
  explanation?: string;
}

export interface ComplianceDetail {
  standard: string;
  controlId: string;
  description: string;
  impact: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  remediation: string;
  fix?: string;
  originalSnippet?: string;
  resourceAddress?: string;
  compliance?: ComplianceDetail[];
  lineNumber?: number;
  endLineNumber?: number;
  fileName?: string;
  costSavings?: string;
  monthlySavingsUsd?: number;
  source?: 'deterministic' | 'ai' | 'hybrid' | 'policy';
  waived?: boolean;
  waiverReason?: string;
  waiverApprovedBy?: string;
  waiverExpires?: string;
}

export interface FinOpsLineItem {
  resourceAddress: string;
  resourceType: string;
  skuDescription: string;
  region: string;
  count: number;
  currentMonthlyUsd: number;
  optimizedMonthlyUsd: number;
  savingsMonthlyUsd: number;
  recommendation: string;
  fileName?: string;
  lineNumber?: number;
}

export interface FinOpsSummary {
  region: string;
  estimatedCurrentMonthlyUsd: number;
  estimatedOptimizedMonthlyUsd: number;
  potentialMonthlySavingsUsd: number;
  annualSavingsUsd: number;
  lineItems: FinOpsLineItem[];
}

export interface DraWaiver {
  id: string;
  resource?: string;
  reason: string;
  approvedBy?: string;
  expires?: string;
}

export interface DraPolicyConfig {
  organization?: string;
  requiredLabels?: string[];
  allowedRegions?: string[];
  bannedMachinePrefixes?: string[];
  pillarWeights?: Record<string, number>;
  customRules?: string[];
  waivers?: DraWaiver[];
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
  waivedFindings?: Finding[];
  finops?: FinOpsSummary;
  diagram?: string;
  usage?: UsageMetadata;
  model?: string;
  provider?: string;
  staticFindingsCount?: number;
  aiFindingsCount?: number;
  policySummary?: {
    organization?: string;
    customRulesApplied: number;
    activeWaivers: number;
    expiredWaivers: number;
  };
}

export interface AuditStageEvent {
  stage: 'dlp' | 'static' | 'finops' | 'policy' | 'ai' | 'complete' | 'error';
  label: string;
  detail?: string;
  progress: number;
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AuditResult | null;
  stage?: AuditStageEvent | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  summary: string;
  result: AuditResult;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const GEMINI_MODEL = 'gemini-2.5-flash';
