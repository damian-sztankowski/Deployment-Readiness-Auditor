import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Play,
  Upload,
  RefreshCw,
  Terminal,
  ChevronUp,
  Edit2,
  FileCode,
  FolderUp,
  ShieldCheck,
  Settings,
  Scale,
  Cpu,
  Layers
} from 'lucide-react';
import { anonymizeHcl } from '../services/dlpService';
import { GEMINI_MODEL, GEMINI_MODEL_PRESETS } from '../types';

export interface InputAnalyzeOptions {
  provider?: 'gemini' | 'static' | 'ollama' | 'lm-studio';
  modelUrl?: string;
  modelName?: string;
  policyYaml?: string;
}

interface InputSectionProps {
  code: string;
  onCodeChange: (code: string) => void;
  policyYaml: string;
  onPolicyChange: (policy: string) => void;
  onAnalyze: (code: string, options?: InputAnalyzeOptions) => void;
  isAnalyzing: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  onRunDemo: () => void;
  highlightedLine?: { fileName?: string; line: number } | null;
  defaultProvider?: 'gemini' | 'static';
  compact?: boolean;
  onModelPreviewChange?: (displayModel: string) => void;
}

const SAMPLE_POLICY_YAML = `organization: "Acme Cloud Platform"
requiredLabels:
  - environment
  - owner
  - cost_center
allowedRegions:
  - us-central1
  - europe-west1
bannedMachinePrefixes:
  - n1-
  - f1-
customRules:
  - "All production Cloud SQL databases must enforce regional HA and PITR backups."
  - "Public external IPv4 addresses are prohibited on Compute VMs."
waivers:
  # Time-bounded exception example (logged in CISO PDF under Accepted Exceptions):
  # - id: "CIS 4.8"
  #   resource: "google_compute_instance.vm_instance"
  #   reason: "Legacy appliance kernel migration scheduled for Q1"
  #   approvedBy: "ciso@company-internal.com"
  #   expires: "2027-06-30"
`;

const STARTER_TEMPLATES: Record<'gcp-tf' | 'gke-docker', { label: string; code: string }> = {
  'gcp-tf': {
    label: 'GCP Terraform Sample',
    code: `### FILE: main.tf ###
# 1. Project Identifiers & Region
provider "google" {
  project = "finance-prod-12345"
  region  = "us-central1"
}

# 2. Compute Workload with Public IP & Hardcoded Secret
resource "google_compute_instance" "vm_instance" {
  name         = "admin-box"
  machine_type = "n1-standard-2"

  metadata = {
    owner-email = "manager@company-internal.com"
    api-key     = "AIzaSyB-4X9-2kLp0-SecretKey99"
  }

  network_interface {
    network    = "prod-secure-vpc"
    subnetwork = "hr-private-subnet"

    access_config {
      nat_ip = "35.192.10.55"
    }
  }
}

# 3. Unrestricted All-Port Firewall Rule
resource "google_compute_firewall" "allow_all" {
  name    = "dangerous-rule"
  network = "prod-secure-vpc"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# 4. Storage Bucket Missing Uniform Access & Versioning
resource "google_storage_bucket" "audit_archive" {
  name     = "finance-audit-archive-prod"
  location = "US"
}

# 5. Unattached High-Cost Persistent Disk
resource "google_compute_disk" "orphan_ssd" {
  name = "unused-analytics-ssd"
  type = "pd-ssd"
  zone = "us-central1-a"
  size = 500
}`
  },
  'gke-docker': {
    label: 'GKE + Dockerfile Sample',
    code: `### FILE: k8s/deployment.yaml ###
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-worker
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: payments
          image: us-central1-docker.pkg.dev/finance-prod-12345/apps/payments:latest
          securityContext:
            privileged: true

### FILE: Dockerfile ###
FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "index.js"]`
  }
};

export const InputSection: React.FC<InputSectionProps> = ({
  code: inputCode,
  onCodeChange: setInputCode,
  policyYaml,
  onPolicyChange,
  onAnalyze,
  isAnalyzing,
  minimized = false,
  onToggleMinimize,
  highlightedLine,
  defaultProvider = 'gemini',
  compact = false,
  onModelPreviewChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [editorTab, setEditorTab] = useState<'iac' | 'policy'>('iac');

  const [provider, setProvider] = useState<'gemini' | 'static' | 'ollama' | 'lm-studio'>(
    defaultProvider
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(GEMINI_MODEL);
  const [customModelName, setCustomModelName] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    setProvider(defaultProvider);
  }, [defaultProvider]);

  const effectiveModelName = useMemo(() => {
    if (provider === 'static') return 'dra-deterministic-ast-v3';
    if (provider === 'gemini') {
      return selectedPreset === 'custom'
        ? customModelName.trim() || GEMINI_MODEL
        : selectedPreset;
    }
    return customModelName.trim() || (provider === 'ollama' ? 'gemma4:e2b' : 'gemma');
  }, [provider, selectedPreset, customModelName]);

  useEffect(() => {
    onModelPreviewChange?.(effectiveModelName);
  }, [effectiveModelName, onModelPreviewChange]);

  const isLocal = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hn = window.location.hostname;
    return (
      hn === 'localhost' ||
      hn === '127.0.0.1' ||
      hn === '[::1]' ||
      hn.startsWith('192.168.') ||
      hn.startsWith('10.')
    );
  }, []);

  const dlpStats = useMemo(() => {
    if (!inputCode.trim()) return null;
    return anonymizeHcl(inputCode);
  }, [inputCode]);

  const activeText = editorTab === 'iac' ? inputCode : policyYaml;
  const lineCount = useMemo(() => Math.max(1, activeText.split('\n').length), [activeText]);

  // Compute physical line index in multi-file buffer when user clicks "Jump to Line" on a finding
  const targetGlobalLine = useMemo(() => {
    if (!highlightedLine || editorTab !== 'iac') return null;
    const lines = inputCode.split('\n');
    if (!highlightedLine.fileName) return highlightedLine.line;

    let currentFile = 'main.tf';
    let localLine = 0;
    for (let idx = 0; idx < lines.length; idx++) {
      const m = lines[idx].match(/^\s*###\s*FILE:\s*(.+?)\s*###\s*$/);
      if (m) {
        currentFile = m[1].trim();
        localLine = 0;
        continue;
      }
      localLine++;
      if (
        (currentFile === highlightedLine.fileName ||
          currentFile.endsWith(`/${highlightedLine.fileName}`)) &&
        localLine === highlightedLine.line
      ) {
        return idx + 1;
      }
    }
    return highlightedLine.line;
  }, [highlightedLine, inputCode, editorTab]);

  useEffect(() => {
    if (targetGlobalLine && textareaRef.current && !minimized) {
      setEditorTab('iac');
      const lineHeightPx = 24;
      const scrollPos = Math.max(0, (targetGlobalLine - 4) * lineHeightPx);
      textareaRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
      if (gutterRef.current) {
        gutterRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
      }
    }
  }, [targetGlobalLine, minimized]);

  const handleScrollSync = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleAnalyze = () => {
    if (inputCode.trim()) {
      onAnalyze(inputCode, {
        provider,
        modelName: effectiveModelName,
        modelUrl: modelUrl.trim() || undefined,
        policyYaml: policyYaml.trim() || undefined
      });
    }
  };

  const loadStarter = (key: 'gcp-tf' | 'gke-docker') => {
    setInputCode(STARTER_TEMPLATES[key].code);
    setEditorTab('iac');
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  const readFileContent = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileContent(file).then((content) => {
      const lower = file.name.toLowerCase();
      if (lower === '.dra.yaml' || lower === 'dra.yaml' || lower === '.dra.yml') {
        onPolicyChange(content);
        setEditorTab('policy');
      } else {
        setInputCode(`### FILE: ${file.name} ###\n${content}`);
        setEditorTab('iac');
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsReadingFiles(true);
    let combinedCode = '# --- MULTI-FILE PROJECT ---\n\n';
    let fileCount = 0;
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

    for (const file of sortedFiles) {
      const fileName = file.name;
      const lower = fileName.toLowerCase();
      const relativePath = (file as any).webkitRelativePath || fileName;

      if (lower === '.dra.yaml' || lower === 'dra.yaml') {
        try {
          onPolicyChange(await readFileContent(file));
        } catch {
          // ignore
        }
        continue;
      }

      if (
        lower.endsWith('.tf') ||
        lower.endsWith('.tofu') ||
        lower.endsWith('.tfvars') ||
        lower.endsWith('.json') ||
        lower.endsWith('.yaml') ||
        lower.endsWith('.yml') ||
        lower === 'dockerfile'
      ) {
        try {
          const content = await readFileContent(file);
          combinedCode += `### FILE: ${relativePath} ###\n${content}\n\n`;
          fileCount++;
        } catch {
          // ignore unreadable binary
        }
      }
    }

    setInputCode(fileCount === 0 ? '# No valid IaC files found.' : combinedCode.trim());
    setIsReadingFiles(false);
    setEditorTab('iac');
    if (folderInputRef.current) folderInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  if (minimized && !compact) {
    return (
      <div className="dra-surface-card w-full bg-white dark:bg-[#0b111e] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-sky-400/10 rounded-xl text-blue-600 dark:text-sky-400">
            <FileCode className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              Infrastructure Source Buffer
            </h2>
            <p className="tabular-nums text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
              {inputCode.split('\n').length} lines • {dlpStats?.redactionCount || 0} sensitive
              fields aliased by DLP
              {policyYaml.trim() ? ' • .dra.yaml Policy Active' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            DLP Protected
          </span>
          <button
            type="button"
            onClick={onToggleMinimize}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
            Expand Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="input-section-container" className="w-full h-full flex flex-col">
      <div className="dra-surface-card flex-1 flex flex-col bg-white dark:bg-[#0b111e] rounded-2xl border border-slate-300/90 dark:border-slate-800 shadow-studio overflow-hidden focus-within:border-blue-500 dark:focus-within:border-sky-500/70 transition-colors">
        {/* Top Editor Toolbar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0e1627] flex flex-wrap justify-between items-center gap-3">
          {/* Left: File / Policy Buffer Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Specification editor tabs"
              className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800"
            >
              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'iac'}
                onClick={() => setEditorTab('iac')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  editorTab === 'iac'
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                IaC Source
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={editorTab === 'policy'}
                onClick={() => setEditorTab('policy')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  editorTab === 'policy'
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                .dra.yaml Policy
                {policyYaml.trim() && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="tabular-nums hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-lg text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {dlpStats?.redactionCount || 0} Aliased Locally
            </div>
          </div>

          {/* Right: File Import & Sample Loaders */}
          <div id="action-buttons-group" className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              File
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".tf,.tofu,.tfvars,.json,.yaml,.yml"
              />
            </label>

            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors cursor-pointer">
              <FolderUp className="w-3.5 h-3.5" aria-hidden="true" />
              Folder
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                onChange={handleFolderUpload}
                {...({ webkitdirectory: '', directory: '' } as any)}
                multiple
              />
            </label>

            {editorTab === 'iac' ? (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadStarter('gcp-tf')}
                  className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline px-2 py-1.5"
                >
                  + Terraform Sample
                </button>
                <button
                  type="button"
                  onClick={() => loadStarter('gke-docker')}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 px-2 py-1.5"
                >
                  <Layers className="w-3 h-3" aria-hidden="true" />
                  GKE/Docker
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onPolicyChange(SAMPLE_POLICY_YAML)}
                className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline px-2 py-1.5"
              >
                + Sample .dra.yaml
              </button>
            )}

            {onToggleMinimize && inputCode.trim() && !compact && (
              <button
                type="button"
                onClick={onToggleMinimize}
                aria-label="Minimize code editor"
                className="p-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Synchronized Line-Numbered Code Buffer */}
        <div
          className={`relative flex flex-1 ${
            compact ? 'min-h-[440px] max-h-[640px]' : 'h-[440px]'
          }`}
        >
          <div
            ref={gutterRef}
            aria-hidden="true"
            className="tabular-nums w-12 py-5 bg-slate-50 dark:bg-[#080d18] border-r border-slate-200 dark:border-slate-800/80 overflow-hidden select-none text-right pr-2.5 font-mono text-xs leading-[24px] text-slate-500 dark:text-slate-500 shrink-0"
          >
            {Array.from({ length: lineCount }, (_, idx) => {
              const ln = idx + 1;
              const isTarget = targetGlobalLine === ln;
              return (
                <div
                  key={ln}
                  className={
                    isTarget
                      ? 'bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold rounded px-1'
                      : ''
                  }
                >
                  {ln}
                </div>
              );
            })}
          </div>

          <textarea
            id="code-editor-area"
            ref={textareaRef}
            onScroll={handleScrollSync}
            value={activeText}
            onChange={(e) =>
              editorTab === 'iac'
                ? setInputCode(e.target.value)
                : onPolicyChange(e.target.value)
            }
            aria-label={
              editorTab === 'iac'
                ? 'Infrastructure as Code editor'
                : 'Organization policy YAML editor'
            }
            placeholder={
              isReadingFiles
                ? 'Reading project files...'
                : editorTab === 'iac'
                  ? 'Paste Terraform (.tf / .tofu), tfplan.json, Kubernetes YAML, or Dockerfile here...'
                  : 'Optional: Define .dra.yaml requiredLabels, allowedRegions, customRules, and time-bounded waivers...'
            }
            className="flex-1 h-full py-5 px-4 sm:px-5 font-mono text-[13px] sm:text-sm text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-[24px] placeholder:text-slate-400 dark:placeholder:text-slate-600"
            spellCheck={false}
          />
        </div>

        {/* Optional Custom Model / Local LLM Drawer */}
        {showAdvancedSettings && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1526] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-enter">
            <div>
              <label
                htmlFor="custom-model-id"
                className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                Custom Model Identifier
              </label>
              <input
                id="custom-model-id"
                type="text"
                value={customModelName}
                onChange={(e) => {
                  setCustomModelName(e.target.value);
                  if (provider === 'gemini') setSelectedPreset('custom');
                }}
                placeholder={
                  provider === 'gemini'
                    ? `${GEMINI_MODEL} (or gemini-4-carbon)`
                    : provider === 'ollama'
                      ? 'gemma4:e2b'
                      : 'gemma'
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            {(provider === 'ollama' || provider === 'lm-studio') && (
              <div>
                <label
                  htmlFor="local-llm-url"
                  className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Local Endpoint URL (Loopback Only)
                </label>
                <input
                  id="local-llm-url"
                  type="text"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  placeholder={
                    provider === 'ollama'
                      ? 'http://localhost:11434/api/generate'
                      : 'http://127.0.0.1:9090/v1/chat/completions'
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Dedicated Bottom Command Bar (Engine Selector + Run Audit CTA — never overlaps code!) */}
        <div
          id="analyze-fab-container"
          className="px-4 sm:px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0e1627] flex flex-wrap items-center justify-between gap-3"
        >
          {/* Left: Provider & Fresh Gemini 4 Model Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
              <label htmlFor="engine-provider-select" className="sr-only">
                Intelligence Provider
              </label>
              <select
                id="engine-provider-select"
                value={provider}
                onChange={(e) => {
                  const next = e.target.value as 'gemini' | 'static' | 'ollama' | 'lm-studio';
                  setProvider(next);
                  if (next === 'ollama') {
                    setCustomModelName('gemma4:e2b');
                    setModelUrl('http://localhost:11434/api/generate');
                    setShowAdvancedSettings(true);
                  } else if (next === 'lm-studio') {
                    setCustomModelName('gemma');
                    setModelUrl('http://127.0.0.1:9090/v1/chat/completions');
                    setShowAdvancedSettings(true);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="gemini">Hybrid Gemini + AST</option>
                <option value="static">Offline Deterministic AST ($0)</option>
                <option value="ollama" disabled={!isLocal}>
                  Ollama (Local){!isLocal ? ' — localhost only' : ''}
                </option>
                <option value="lm-studio" disabled={!isLocal}>
                  LM Studio (Local){!isLocal ? ' — localhost only' : ''}
                </option>
              </select>
            </div>

            {provider === 'gemini' && (
              <div>
                <label htmlFor="gemini-model-preset" className="sr-only">
                  Gemini Model Preset
                </label>
                <select
                  id="gemini-model-preset"
                  value={selectedPreset}
                  onChange={(e) => {
                    setSelectedPreset(e.target.value);
                    if (e.target.value === 'custom') {
                      setShowAdvancedSettings(true);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-sky-950/40 border border-blue-200 dark:border-sky-800 text-xs font-bold text-blue-800 dark:text-sky-300"
                >
                  {GEMINI_MODEL_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label} ({preset.badge})
                    </option>
                  ))}
                  <option value="custom">Custom Model ID...</option>
                </select>
              </div>
            )}

            {provider !== 'static' && (
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                aria-expanded={showAdvancedSettings}
                aria-label="Toggle custom model endpoint settings"
                title="Custom Model & Endpoint Settings"
                className={`p-1.5 rounded-lg border transition-colors ${
                  showAdvancedSettings
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500'
                }`}
              >
                <Settings className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Right: Line Counter + Run Audit Button */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="tabular-nums hidden sm:inline text-xs font-mono text-slate-500 dark:text-slate-400">
              {lineCount} ln
            </span>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isAnalyzing || !inputCode.trim() || isReadingFiles
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
              {isAnalyzing ? 'Auditing...' : 'Run Hybrid Audit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
