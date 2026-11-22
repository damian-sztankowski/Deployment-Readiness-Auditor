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

export type AuditWorkspaceMode =
  | 'split'
  | 'overview'
  | 'topology'
  | 'governance'
  | 'full';

export interface GeminiModelPreset {
  id: string;
  label: string;
  badge: string;
  description: string;
}

export const GEMINI_MODEL = 'gemini-4-hydrogen';

export const GEMINI_MODEL_PRESETS: GeminiModelPreset[] = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    badge: 'Default • Fast',
    description: 'Fastest Gemini 4 frontier model for agentic IaC audits & CI/CD gates (1M ctx)'
  },
  {
    id: 'gemini-4-carbon',
    label: 'Gemini 4 Carbon',
    badge: 'Deep Frontier',
    description: 'Maximum multi-hop security & regulatory compliance reasoning depth'
  },
  {
    id: 'gemini-4-neon',
    label: 'Gemini 4 Neon',
    badge: 'Code & Arch',
    description: 'Balanced frontier reasoning for multi-module Terraform & GKE refactors'
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    badge: 'Sparse MoE',
    description: 'Low-cost enterprise compliance synthesis for large monorepo plans'
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    badge: '3.x Stable',
    description: 'High-throughput Gemini 3.8 Flash model for rapid pipeline checks'
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    badge: '3.x Pro',
    description: 'Previous-generation Pro reasoning baseline'
  }
];

export const formatModelDisplayName = (rawModel?: string): string => {
  const id = (rawModel || GEMINI_MODEL).trim();
  const preset = GEMINI_MODEL_PRESETS.find((p) => p.id === id);
  if (preset) return preset.label;
  if (id === 'dra-deterministic-ast-v3' || id === 'static') {
    return 'Deterministic AST v3';
  }
  return id
    .replace(/^gemini-/i, 'Gemini ')
    .replace(/-preview$/i, ' Preview')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

