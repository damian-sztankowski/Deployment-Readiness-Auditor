import React, { useState } from 'react';
import { 
  BookOpen, Layers, Terminal, Sparkles, Shield, ShieldCheck, 
  CheckCircle2, Copy, Check, FileText, Cpu, GitBranch, ArrowRight, 
  ExternalLink, Download, AlertTriangle, Activity, Zap, DollarSign, 
  Database, Server, RefreshCw, CheckCircle, Tag, Globe, Sliders,
  ShieldAlert
} from 'lucide-react';
import { DiagramView } from './DiagramView';

interface InternalDocsProps {
  onStartAssessment: () => void;
}

const ARCHITECTURE_MERMAID = `flowchart TD
    subgraph S_Inputs["Layer 1: Infrastructure Inputs"]
        TF["Terraform Code (.tf, .tfvars)"]
        PLAN["Terraform Plan (tfplan.json)"]
        DIR["Multi-File Directory Upload"]
    end

    subgraph S_Client["Layer 2: Client Interfaces"]
        WEB["DRA Web UI (React + Tailwind)"]
        CLI["DRA CLI (Go Binary / CI-CD)"]
    end

    subgraph S_Backend["Layer 3: Serverless Backend (Cloud Run)"]
        RATE["Rate Limiter (DoW Protection)"]
        AUTH["IAM Token Validator"]
        DLP["Entropy & Regex DLP Redactor"]
        PROXY["AI Engine Dispatcher"]
    end

    subgraph S_AI["Layer 4: Audit Intelligence Engines"]
        GEMINI["Google Gemini 2.5 (Official GenAI SDK)"]
        LOCAL["Local LLMs (Ollama / LM Studio)"]
    end

    subgraph S_Outputs["Layer 5: Governance & Artifact Outputs"]
        VERDICT["Executive Verdict Banner & Grade"]
        TOPOLOGY["Architecture Topology Map"]
        COMPLIANCE["Compliance Matrix (6 Standards)"]
        BUNDLE["Remediation Bundle (.patch / .tf)"]
        PDF["CISO Executive PDF Brief"]
        SARIF["SARIF 2.1.0 (GitHub Security)"]
    end

    TF --> WEB
    TF --> CLI
    PLAN --> WEB
    DIR --> WEB

    WEB --> RATE
    CLI --> RATE
    RATE --> AUTH
    AUTH --> DLP
    DLP --> PROXY

    PROXY --> GEMINI
    PROXY --> LOCAL

    GEMINI --> VERDICT
    GEMINI --> TOPOLOGY
    GEMINI --> COMPLIANCE
    GEMINI --> BUNDLE
    GEMINI --> PDF

    LOCAL --> VERDICT
    LOCAL --> COMPLIANCE
    LOCAL --> BUNDLE

    CLI --> SARIF`;

export const InternalDocs: React.FC<InternalDocsProps> = ({ onStartAssessment }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'models' | 'cicd' | 'releases'>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="animate-enter space-y-16 py-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <BookOpen className="w-3.5 h-3.5" />
            Internal Engineering Documentation & Specifications
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            DRA Technical Manual <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              & Release Notes
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
            Architectural reference, data flow pipelines, LLM engine configuration guide, CI/CD quality gate enforcement, and release history for the Deployment Readiness Auditor.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              Launch Audit Engine
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/damian-sztankowski/Deployment-Readiness-Auditor"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all"
            >
              GitHub Repository
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'System Overview', icon: Sparkles },
          { id: 'architecture', label: 'Architecture & Flow', icon: Layers },
          { id: 'models', label: 'LLM Model Engine', icon: Cpu },
          { id: 'cicd', label: 'CI/CD & CLI Gates', icon: Terminal },
          { id: 'releases', label: 'Release Notes (v2.5.0)', icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-12 animate-enter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Well-Architected Alignment</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                DRA scores IaC strictly against the <strong>5 official pillars</strong> of the Google Cloud Architecture Framework: Security, FinOps Cost, Reliability, Operational Excellence, and Performance.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">6 Regulatory Standards</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Findings are mapped to specific control IDs across <strong>CIS GCP v2.0, NIST SP 800-53 Rev. 5, GDPR Art. 32, HIPAA Security Rule, PCI DSS v4.0, and SOC 2 Type II</strong>.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-black">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">FinOps & Blast Radius</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Quantifies monthly reclaimable cloud budget (\$/mo) from idle resources, right-sizes compute instances, and flags architectural blast radii before deployment.
              </p>
            </div>
          </div>

          {/* Audit Inputs Supported */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Supported Input Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Terraform Code</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">*.tf, *.tfvars</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Pure HCL Configurations</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Evaluates declarative resource blocks, module orchestrations, variable bindings, and network topologies. Supports single-file or recursive folder uploads.
                </p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Execution Plan</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">tfplan.json</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Terraform Plan JSON</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Exported via <code className="text-indigo-500">terraform show -json tfplan.binary &gt; tfplan.json</code>. Evaluates runtime planned changes (<code className="text-emerald-500">change.after</code>) before resources are provisioned.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE & MERMAID */}
      {activeTab === 'architecture' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Diagram View</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                End-to-End System Architecture
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Decoupled architecture showing the flow from infrastructure code ingestion through rate limiting, token authentication, DLP redactor, AI dispatchers, and governance artifacts.
              </p>
            </div>

            {/* Rendered Mermaid Topology */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/40">
              <DiagramView code={ARCHITECTURE_MERMAID} />
            </div>
          </div>

          {/* Security & Pipeline Deep Dive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Enterprise DLP Sanitization</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Before sending payloads to any LLM engine, DRA executes multi-pass regex and entropy sanitization. Project IDs are converted into semantic aliases (<code className="text-indigo-500">PROJECT_ID_1</code>), IP ranges become <code className="text-indigo-500">IP_RANGE_1</code>, and high-entropy credentials (GCP API keys, AWS access tokens, PEM private keys) are scrubbed.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Sliding-Window Rate Limiter</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The <code className="text-emerald-500">/api/audit</code> endpoint includes an in-memory token-bucket sliding-window rate limiter (15 requests per 15-minute window per IP) to guard against Denial of Wallet (DoW) attacks with standard HTTP 429 and <code className="text-slate-400">Retry-After</code> response headers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LLM MODEL CONFIGURATION */}
      {activeTab === 'models' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-indigo-500" />
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Configuring Model Versions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">DRA offers 4 flexible methods to select your audit model.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option 1 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Option 1: Google Cloud Run</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">Production</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Update Cloud Run Environment</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Set the default model for all web users without rebuilding code:</p>
                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-900 p-4 rounded-xl text-emerald-400 overflow-x-auto border border-slate-800">
{`gcloud run services update dra-app \\
  --region us-central1 \\
  --project deployment-readiness-auditor \\
  --update-env-vars="LLM_MODEL=gemini-2.5-pro"`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard('gcloud run services update dra-app --region us-central1 --project deployment-readiness-auditor --update-env-vars="LLM_MODEL=gemini-2.5-pro"', 'opt1')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                  >
                    {copiedSnippet === 'opt1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Option 2: Web UI Settings</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">Per-Audit</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">In-Browser Settings Drawer</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the <strong>Settings icon (slider toggle)</strong> in the bottom-right corner of the code editor. Under "Audit Engine Settings", choose <strong>Gemini</strong> or <strong>Self-Hosted (Ollama)</strong>, specify model name (<code className="text-indigo-500">gemini-2.5-pro</code>), and run the audit.
                </p>
              </div>

              {/* Option 3 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Option 3: Terminal CLI</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">CI/CD</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Override Flag in dra-cli</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pass the <code className="text-indigo-500">--llm-model</code> flag when running scans:</p>
                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-900 p-4 rounded-xl text-emerald-400 overflow-x-auto border border-slate-800">
{`./dra-cli/bin/dra-cli scan \\
  --path ./terraform \\
  --llm-model="gemini-2.5-pro"`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard('./dra-cli/bin/dra-cli scan --path ./terraform --llm-model="gemini-2.5-pro"', 'opt3')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                  >
                    {copiedSnippet === 'opt3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Option 4 */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Option 4: Local Dev Server</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">Localhost</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Local Environment Variable</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pass environment variables during npm start:</p>
                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-900 p-4 rounded-xl text-emerald-400 overflow-x-auto border border-slate-800">
{`cd dra-app
LLM_MODEL="gemini-2.5-pro" \\
API_KEY="AIzaSy..." \\
npm start`}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard('cd dra-app && LLM_MODEL="gemini-2.5-pro" API_KEY="your-key" npm start', 'opt4')}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
                  >
                    {copiedSnippet === 'opt4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Supported Models Matrix */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">Supported Model Matrix</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Model Identifier</th>
                      <th className="p-4">Recommended Use Case</th>
                      <th className="p-4">Latency & Cost</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">gemini-2.5-flash</td>
                      <td className="p-4">Rapid developer feedback, routine audits, fast CI/CD quality gates</td>
                      <td className="p-4">Lowest latency / Minimal token cost</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Default</span></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">gemini-2.5-pro</td>
                      <td className="p-4">Complex multi-module architectures, high-stakes regulatory audits</td>
                      <td className="p-4">Deep reasoning / High accuracy</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase">Recommended</span></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">gemini-1.5-pro</td>
                      <td className="p-4">Massive enterprise codebases, huge tfplan.json execution plans</td>
                      <td className="p-4">Ultra-long context window (up to 2M tokens)</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase">Supported</span></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">gemma4:e2b / ollama</td>
                      <td className="p-4">Strictly air-gapped sovereign environments via local Ollama / LM Studio</td>
                      <td className="p-4">Zero outbound network traffic / Self-hosted</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Offline</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: CI/CD & CLI QUALITY GATES */}
      {activeTab === 'cicd' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">Automated Pipeline Gates</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                DevSecOps Enforcement with dra-cli
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Automate infrastructure compliance in GitHub Actions, GitLab CI, or Cloud Build with zero-tolerance thresholds.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Quality Gate Commands</h4>
              <div className="relative">
                <pre className="text-xs font-mono bg-slate-900 p-5 rounded-2xl text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed">
{`# 1. Enforce zero-tolerance gate on critical and high risks (exit code 1 if violated):
./dra-cli/bin/dra-cli scan --path ./terraform --deep-scan --yes --fail-on critical,high

# 2. Enforce minimum overall Well-Architected readiness score (e.g. 75/100):
./dra-cli/bin/dra-cli scan --path ./terraform --min-score 75

# 3. Export SARIF 2.1.0 report for native GitHub Code Scanning Security Tab:
./dra-cli/bin/dra-cli scan --path ./terraform --output sarif --output-file dra-results.sarif

# 4. Generate automated Git patch bundle for instant remediation:
./dra-cli/bin/dra-cli scan --path ./terraform --fix-patch dra-remediation.patch
git apply dra-remediation.patch`}
                </pre>
                <button 
                  onClick={() => copyToClipboard('./dra-cli/bin/dra-cli scan --path ./terraform --fail-on critical,high', 'cli1')}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {copiedSnippet === 'cli1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">GitHub Action Integration</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A turnkey GitHub Action workflow is included in <code className="text-indigo-500 font-bold">.github/workflows/dra-audit.yml</code>:
              </p>
              <div className="relative">
                <pre className="text-xs font-mono bg-slate-900 p-5 rounded-2xl text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
{`name: DRA Architecture Audit
on: [pull_request, push]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run DRA Quality Gate
        env:
          API_KEY: \${{ secrets.GEMINI_API_KEY }}
        run: |
          ./dra-cli/bin/dra-cli scan --path ./terraform \\
            --fail-on critical,high \\
            --output sarif --output-file results.sarif
      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RELEASE NOTES */}
      {activeTab === 'releases' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-10">
            
            {/* v2.5.0 */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                    v2.5.0 Milestone
                  </span>
                  <span className="text-xs font-bold text-slate-400">September 2026</span>
                </div>
                <span className="px-3 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                  Current Production Release
                </span>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Major Platform Enhancements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Executive Deployment Verdict Banner", desc: "Immediate Go/No-Go gatekeeper status, blast radius indicators, maturity letter grades, and 4 KPI metric cards." },
                    { title: "Multi-Framework Regulatory Compliance Matrix", desc: "Interactive cards and searchable control tables for CIS GCP v2.0, NIST SP 800-53, GDPR, HIPAA, PCI DSS, and SOC 2." },
                    { title: "Boardroom-Ready CISO Multi-Page PDF Brief", desc: "Executive dark cover, clearance stamp, pillar scorecards, compliance tables, code fixes, and formal 3-party governance sign-off blocks." },
                    { title: "Automated Remediation Bundle ('Remediate All')", desc: "One-click export of unified Git patches (dra-remediation.patch applicable via git apply) and consolidated HCL fixes." },
                    { title: "Adaptive Dual-Theme UX", desc: "High-contrast typography, elevated card surfaces, and accessible colorways for both obsidian dark and clean white light modes." },
                    { title: "Interactive Topology Map with Mermaid", desc: "Dynamic architecture dependency graph with zoom, pan, and full-screen inspection." },
                    { title: "Terraform Plan JSON (tfplan.json) Support", desc: "Audit planned infrastructure changes before terraform apply by evaluating change.after properties." },
                    { title: "CLI CI/CD Gatekeeping & SARIF 2.1.0", desc: "Automated --fail-on and --min-score flags, SARIF 2.1.0 output for GitHub Security alerts, and turnkey GitHub Action workflow." },
                    { title: "Sliding-Window API Rate Limiting", desc: "Built-in rate limiter protecting /api/audit against Denial of Wallet (DoW) with standard Retry-After headers." },
                    { title: "Interactive Internal Docs & Release Notes", desc: "Embedded architectural guides, model version guides, and release notes directly accessible in the web portal." }
                  ].map((item, i) => (
                    <div key={i} className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h5>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* v2.0.0 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-black uppercase tracking-widest">
                  v2.0.0
                </span>
                <span className="text-xs font-bold text-slate-400">August 2026</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li>Introduced hybrid LLM dispatching supporting both Google Gemini official SDK and local Ollama / LM Studio engines.</li>
                <li>Added initial stateful DLP pre-processor for masking Project IDs and IP ranges.</li>
                <li>Added local browser audit history preservation.</li>
              </ul>
            </div>

            {/* v1.0.0 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-black uppercase tracking-widest">
                  v1.0.0
                </span>
                <span className="text-xs font-bold text-slate-400">June 2026</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li>Initial release of Deployment Readiness Auditor for pure Terraform (HCL) scanning.</li>
                <li>Implementation of the 5 Google Cloud Well-Architected Framework assessment pillars.</li>
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
