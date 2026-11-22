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
  Cpu
} from 'lucide-react';
import { anonymizeHcl } from '../services/dlpService';

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
  defaultProvider = 'gemini'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [editorTab, setEditorTab] = useState<'iac' | 'policy'>('iac');

  const [provider, setProvider] = useState<'gemini' | 'static' | 'ollama' | 'lm-studio'>(defaultProvider);
  const [modelName, setModelName] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setProvider(defaultProvider);
  }, [defaultProvider]);

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
      const lineHeightPx = 26;
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
        modelName: modelName.trim() || undefined,
        modelUrl: modelUrl.trim() || undefined,
        policyYaml: policyYaml.trim() || undefined
      });
    }
  };

  const loadExample = () => {
    const example = `# 1. Project Identifiers & Region
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
}`;
    setInputCode(example);
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

  if (minimized) {
    return (
      <div className="w-full max-w-[1400px] mx-auto bg-white dark:bg-[#0a0f1e] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800/60 p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl text-indigo-600 dark:text-indigo-400">
            <FileCode className="w-9 h-9" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white leading-none">
              Infrastructure Specification
            </h3>
            <p className="text-sm text-slate-500 font-mono mt-2">
              {inputCode.split('\n').length} lines • {dlpStats?.redactionCount || 0} fields protected by Client-Side DLP
              {policyYaml.trim() ? ' • .dra.yaml Policy Active' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Bidirectional DLP Active
          </div>
          <button
            type="button"
            onClick={onToggleMinimize}
            className="flex items-center gap-3 text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-8 py-4 rounded-[1.5rem] transition-all"
          >
            <Edit2 className="w-4 h-4" aria-hidden="true" />
            Inspect / Edit Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="input-section-container" className="relative group w-full max-w-[1400px] mx-auto">
      <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-pink-500 via-purple-500 via-cyan-500 to-indigo-500 blur-3xl opacity-15 group-hover:opacity-30 group-focus-within:opacity-40 transition-opacity animate-gradient bg-300% pointer-events-none" />

      <div className="relative p-[2.5px] rounded-[2.2rem] bg-gradient-to-r from-indigo-500 via-pink-500 via-purple-500 via-cyan-500 to-indigo-500 animate-gradient bg-300% shadow-3xl overflow-hidden transition-all duration-500">
        <div className="relative bg-white dark:bg-[#0a0f1e] rounded-[calc(2.2rem-2.5px)] overflow-hidden transition-colors">
          <div className="px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#111827]/40 flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setEditorTab('iac')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  editorTab === 'iac'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4" aria-hidden="true" />
                IaC Source (.tf / Plan / K8s)
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('policy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  editorTab === 'policy'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Scale className="w-4 h-4" aria-hidden="true" />
                Org Policy (.dra.yaml)
                {policyYaml.trim() && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {dlpStats?.redactionCount || 0} Sensitive Fields Aliased Locally
              </div>
            </div>

            <div id="action-buttons-group" className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                Upload File
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".tf,.tofu,.tfvars,.json,.yaml,.yml"
                />
              </label>

              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                <FolderUp className="w-3.5 h-3.5" aria-hidden="true" />
                Upload Project
                <input
                  ref={folderInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFolderUpload}
                  {...({ webkitdirectory: '', directory: '' } as any)}
                  multiple
                />
              </label>

              <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />

              {editorTab === 'iac' ? (
                <button
                  type="button"
                  onClick={loadExample}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 px-3 py-2 transition-colors"
                >
                  Load Example
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPolicyChange(SAMPLE_POLICY_YAML)}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 px-3 py-2 transition-colors"
                >
                  Sample Policy
                </button>
              )}

              {onToggleMinimize && inputCode.trim() && (
                <button
                  type="button"
                  onClick={onToggleMinimize}
                  aria-label="Minimize code editor"
                  className="p-2 bg-slate-100 dark:bg-[#1e293b]/60 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Synchronized Line-Numbered Code Editor */}
          <div className="relative flex h-[520px]">
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="w-14 py-8 bg-slate-50/80 dark:bg-slate-950/60 border-r border-slate-100 dark:border-slate-800/70 overflow-hidden select-none text-right pr-3 font-mono text-xs leading-[26px] text-slate-400 dark:text-slate-600 shrink-0"
            >
              {Array.from({ length: lineCount }, (_, idx) => {
                const ln = idx + 1;
                const isTarget = targetGlobalLine === ln;
                return (
                  <div
                    key={ln}
                    className={
                      isTarget
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black rounded px-1'
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
              className="flex-1 h-full py-8 px-6 font-mono text-sm md:text-base text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-[26px] placeholder:text-slate-300 dark:placeholder:text-slate-700"
              spellCheck={false}
            />

            {/* Audit Engine Settings Popover Card */}
            {showSettings && (
              <div className="absolute bottom-28 right-8 z-40 w-96 max-w-[calc(100%-2rem)] p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-enter">
                <div className="flex items-center justify-between text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                    Audit Engine Settings
                  </span>
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <Cpu className="w-3 h-3" aria-hidden="true" /> Hybrid v3.0
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Intelligence Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-2 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                    <button
                      type="button"
                      onClick={() => {
                        setProvider('gemini');
                        setModelName('');
                        setModelUrl('');
                      }}
                      className={`py-2 px-2 rounded-lg text-[10px] font-black transition-all ${
                        provider === 'gemini'
                          ? 'bg-white dark:bg-slate-800 shadow text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Hybrid Gemini + AST
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProvider('static');
                        setModelName('dra-deterministic-ast-v3');
                        setModelUrl('');
                      }}
                      className={`py-2 px-2 rounded-lg text-[10px] font-black transition-all ${
                        provider === 'static'
                          ? 'bg-white dark:bg-slate-800 shadow text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Deterministic AST (Offline)
                    </button>
                    <button
                      type="button"
                      disabled={!isLocal}
                      onClick={() => {
                        setProvider('ollama');
                        setModelName('gemma4:e2b');
                        setModelUrl('http://localhost:11434/api/generate');
                      }}
                      title={!isLocal ? 'Available when running DRA locally' : 'Local Ollama LLM'}
                      className={`py-2 px-2 rounded-lg text-[10px] font-black transition-all ${
                        !isLocal
                          ? 'opacity-35 cursor-not-allowed text-slate-400'
                          : provider === 'ollama'
                            ? 'bg-white dark:bg-slate-800 shadow text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Ollama (Local)
                    </button>
                    <button
                      type="button"
                      disabled={!isLocal}
                      onClick={() => {
                        setProvider('lm-studio');
                        setModelName('gemma');
                        setModelUrl('http://127.0.0.1:9090/v1/chat/completions');
                      }}
                      title={!isLocal ? 'Available when running DRA locally' : 'Local LM Studio'}
                      className={`py-2 px-2 rounded-lg text-[10px] font-black transition-all ${
                        !isLocal
                          ? 'opacity-35 cursor-not-allowed text-slate-400'
                          : provider === 'lm-studio'
                            ? 'bg-white dark:bg-slate-800 shadow text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      LM Studio (Local)
                    </button>
                  </div>
                </div>

                {provider !== 'static' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder={
                        provider === 'gemini'
                          ? 'gemini-2.5-flash (default) or gemini-2.5-pro'
                          : provider === 'ollama'
                            ? 'gemma4:e2b'
                            : 'gemma'
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {(provider === 'ollama' || provider === 'lm-studio') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Local Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={modelUrl}
                      onChange={(e) => setModelUrl(e.target.value)}
                      placeholder={
                        provider === 'ollama'
                          ? 'http://localhost:11434/api/generate'
                          : 'http://127.0.0.1:9090/v1/chat/completions'
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            <div id="analyze-fab-container" className="absolute bottom-8 right-8 z-30 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Toggle audit engine settings"
                className={`p-4 md:p-5 rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  showSettings
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Settings className={`w-5 h-5 md:w-6 md:h-6 ${showSettings ? 'animate-spin-slow' : ''}`} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
                className={`flex items-center gap-4 px-8 md:px-11 py-4 md:py-5 rounded-[2rem] font-black text-base md:text-xl shadow-3xl transition-all duration-300 ${
                  isAnalyzing || !inputCode.trim() || isReadingFiles
                    ? 'bg-slate-200 text-slate-400 dark:bg-[#1e293b] dark:text-slate-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30 border border-indigo-400/20'
                }`}
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-5 h-5 md:w-6 md:h-6 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" aria-hidden="true" />
                )}
                {isAnalyzing ? 'Auditing...' : 'Run Audit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
