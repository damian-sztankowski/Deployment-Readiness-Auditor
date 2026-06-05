import React, { useState, useEffect } from 'react';
import { 
  Terminal, Play, Cpu, Server, Key, ShieldCheck, 
  Copy, Check, ArrowRight, BookOpen, Settings, HelpCircle, Code,
  RefreshCw, Command, Info, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';

export const CliInfo: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [terminalState, setTerminalState] = useState<'idle' | 'typing' | 'loading' | 'completed'>('idle');
  const [typedCommand, setTypedCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'build' | 'scan' | 'self-hosted'>('build');
  const [loadingFrame, setLoadingFrame] = useState(0);

  const fullCommand = 'dra-cli scan --path ./gcp-infrastructure';

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (terminalState === 'loading') {
      interval = setInterval(() => {
        setLoadingFrame(prev => (prev + 1) % 16);
      }, 85);
    }
    return () => clearInterval(interval);
  }, [terminalState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (terminalState === 'typing') {
      let index = 0;
      setTypedCommand('');
      const interval = setInterval(() => {
        if (index < fullCommand.length) {
          setTypedCommand(prev => prev + fullCommand[index]);
          index++;
        } else {
          clearInterval(interval);
          timer = setTimeout(() => {
            setTerminalState('loading');
          }, 600);
        }
      }, 50);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else if (terminalState === 'loading') {
      timer = setTimeout(() => {
        setTerminalState('completed');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [terminalState]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippets = {
    build: 'cd dra-cli\nmake build',
    runSimple: './dra-cli/bin/dra-cli scan --path /path/to/terraform',
    runLocalLLM: './dra-cli/bin/dra-cli scan \\\n  --path /path/to/terraform \\\n  --llm-provider ollama \\\n  --llm-model gemma4:e2b \\\n  --llm-url http://localhost:11434/api/generate',
    envToken: 'export GCP_IAM_TOKEN=$(gcloud auth print-identity-token)\n./dra-cli/bin/dra-cli scan --path .'
  };

  return (
    <div className="animate-enter space-y-16 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
          <Command className="w-3.5 h-3.5" />
          Developer Tooling
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
          DRA CLI Command Center
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Audit your infrastructure specification right from your local terminal, custom pre-commit hooks, and CI/CD pipelines.
        </p>
      </div>

      {/* Interactive Terminal Simulator */}
      <div className="max-w-4xl mx-auto w-full px-2">
        <div className="bg-[#0b0f19] rounded-[2rem] border border-slate-800 shadow-2xl shadow-indigo-950/20 overflow-hidden relative">
          
          {/* Terminal Window Header */}
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80 inline-block"></span>
              <span className="ml-4 font-mono text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                zsh — dra-cli scan
              </span>
            </div>
            <div>
              {terminalState !== 'typing' && terminalState !== 'loading' && (
                <button 
                  onClick={() => setTerminalState('typing')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg transition-all text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run Demo Scan
                </button>
              )}
            </div>
          </div>

          {/* Terminal Content Screen */}
          <div className="p-6 md:p-8 font-mono text-[12px] text-slate-300 leading-relaxed overflow-x-auto min-h-[480px] max-h-[600px] overflow-y-auto">
            {/* Prompt Line */}
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-black">user@localhost</span>
              <span className="text-slate-500">~/gcp-infra</span>
              <span className="text-indigo-400 font-black">%</span>
              <span>
                {terminalState === 'idle' && (
                  <span className="text-slate-500 italic">Click "Run Demo Scan" above to simulate CLI run...</span>
                )}
                {terminalState === 'typing' && (
                  <span>
                    {typedCommand}
                    <span className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse ml-0.5"></span>
                  </span>
                )}
                {terminalState !== 'idle' && terminalState !== 'typing' && (
                  <span className="text-white">{fullCommand}</span>
                )}
              </span>
            </div>

            {/* Spinner Stage */}
            {terminalState === 'loading' && (
              <div className="mt-4 text-amber-400 flex items-center gap-2">
                <span className="whitespace-pre font-mono font-bold">
                  {["🤖        ", " 🤖       ", "  🤖      ", "   🤖     ", "    🤖    ", "     🤖   ", "      🤖  ", "       🤖 ", "        🤖", "       🤖 ", "      🤖  ", "     🤖   ", "    🤖    ", "   🤖     ", "  🤖      ", " 🤖       "][loadingFrame]}
                </span>
                <span>Auditing HCL topology and verifying compliance mapping...</span>
              </div>
            )}

            {/* Output Stage */}
            {terminalState === 'completed' && (
              <div className="mt-4 space-y-4 animate-enter">
                <div className="text-indigo-400 font-bold">
                  ====================================================<br />
                       Deployment Readiness Auditor (DRA) CLI         <br />
                  ====================================================
                </div>
                <div className="text-amber-400">
                  ℹ️  No GCP_IAM_TOKEN set. Proceeding without authorization header for local endpoint.
                </div>
                <div>
                  📦 Found 1 file(s). Transmitting payload to DRA Engine:<br />
                  -&gt; <span className="underline">http://localhost:8080/api/audit</span>... 🚀
                </div>

                <div className="text-indigo-400 font-bold mt-6">
                  ====================================================<br />
                  📊 AUDIT RUN SUMMARY<br />
                  ====================================================
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                  <div>🔍 Files Audited : <span className="font-bold text-white">1</span></div>
                  <div>🔴 Critical Risks: <span className="font-bold text-red-500">0</span></div>
                  <div>🟠 High Risks    : <span className="font-bold text-yellow-500">2</span></div>
                  <div>🟡 Medium Risks  : <span className="font-bold text-yellow-400">3</span></div>
                  <div>🔵 Low/Info Risks: <span className="font-bold text-indigo-400">1</span></div>
                </div>
                <div className="text-indigo-400 font-bold">
                  ====================================================
                </div>

                <div className="mt-4">
                  <span className="text-indigo-400 font-black">📢 EXECUTIVE SUMMARY:</span><br />
                  <p className="text-slate-300 pl-4 mt-3 border-l-2 border-slate-700">
                    The audit of bucket.tf revealed multiple security and reliability vulnerabilities. The bucket lacks uniform bucket-level access, versioning, and access logging, while force_destroy is enabled, risking permanent data loss.
                  </p>
                </div>

                {/* Score Progress Bars */}
                <div className="mt-6">
                  <div className="text-white font-bold mb-4">📊 ARCHITECTURE PILLAR SCORES (Google Cloud Framework):</div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 pl-4">
                      <span className="w-32 text-slate-300 font-bold">
                        [<span className="text-red-500 font-bold">✘</span>] Security
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-red-500 font-mono">██████░░░░░░░░░░░░░░</span>
                        <span className="text-white font-bold">30/100</span>
                        <span className="text-slate-400 text-[11px]">— Missing uniform bucket access.</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 pl-4">
                      <span className="w-32 text-slate-300 font-bold">
                        [<span className="text-yellow-400 font-bold">!</span>] Reliability
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-mono">████████░░░░░░░░░░░░</span>
                        <span className="text-white font-bold">40/100</span>
                        <span className="text-slate-400 text-[11px]">— force_destroy is set to true.</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-2 pl-4">
                      <span className="w-32 text-slate-300 font-bold">
                        [<span className="text-emerald-400 font-bold">✔</span>] FinOps
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-mono">██████████████████░░</span>
                        <span className="text-white font-bold">90/100</span>
                        <span className="text-slate-400 text-[11px]">— Optimized, consider tier rules.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boxed Finding */}
                <div className="mt-8 text-yellow-500">
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━<br />
                  <span className="font-bold"> 1. [🟠 HIGH] Missing Uniform Bucket-Level Access (Category: Security)</span><br />
                  ────────────────────────────────────────────────────────────────────────────────<br />
                  <span className="text-slate-400">  📍 Location:</span> bucket.tf (Line 1)<br /><br />
                  <span className="text-slate-400">  📝 Description:</span> Legacy ACLs are active. Disabling uniform bucket access increases public exposure risk.<br /><br />
                  <span className="text-slate-400">  🔧 Remediation:</span> Set uniform_bucket_level_access = true in bucket block.<br /><br />
                  <span className="text-slate-400">  📋 Compliance:</span><br />
                  <span className="text-slate-300 pl-4">      • CIS GCP Benchmark (5.1)</span><br /><br />
                  ────────────────────────────────────────────────────────────────────────────────<br />
                  <span className="text-emerald-400">  💡 Suggested HCL Fix:</span><br />
                  <span className="text-emerald-500 pl-6">      resource "google_storage_bucket" "vulnerable_bucket" &#123;</span><br />
                  <span className="text-emerald-500 pl-6">        name                        = "my-public-bucket-12345"</span><br />
                  <span className="text-emerald-500 pl-6">        uniform_bucket_level_access = true</span><br />
                  <span className="text-emerald-500 pl-6">      &#125;</span><br />
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs and Details */}
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('build')}
            className={`pb-4 px-6 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'build'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            1. Compile Binary
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`pb-4 px-6 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'scan'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            2. Run Scans
          </button>
          <button
            onClick={() => setActiveTab('self-hosted')}
            className={`pb-4 px-6 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'self-hosted'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            3. Self-Hosted Config
          </button>
        </div>

        {/* Tab 1 Content */}
        {activeTab === 'build' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Build Standalone CLI</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Compile the CLI client from the project workspace. The build command relies on Go to compile a highly optimized, dependency-free binary targeting your native operating system.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-indigo-500" /> Go v1.20+</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Safe & Sandbox-tested</span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-sm text-emerald-400 shadow-xl">
              <div className="absolute top-3 right-3 text-[10px] text-slate-600 uppercase tracking-widest font-black">Makefile</div>
              <pre className="overflow-x-auto whitespace-pre">{codeSnippets.build}</pre>
              <button 
                onClick={() => handleCopy(codeSnippets.build, 'build')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
              >
                {copiedText === 'build' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2 Content */}
        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Scan Infrastructure Folder</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Pass a relative or absolute folder path to scan its components. The CLI reads all `.tf` files in the directory, processes them through the DLP anonymization shim, and audits them via the central engine.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Play className="w-4 h-4 text-indigo-500" /> Immediate Assessment</span>
                <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-500" /> Full HCL Support</span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-sm text-emerald-400 shadow-xl">
              <div className="absolute top-3 right-3 text-[10px] text-slate-600 uppercase tracking-widest font-black">CLI Scan</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runSimple}</pre>
              <button 
                onClick={() => handleCopy(codeSnippets.runSimple, 'runSimple')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
              >
                {copiedText === 'runSimple' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3 Content */}
        {activeTab === 'self-hosted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Configure Local Model Engines</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Bypass external requests entirely. Configure the CLI flags to direct analysis payloads to your local Ollama or LM Studio models. This overrides project token requirements.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Server className="w-4 h-4 text-amber-500" /> Local LLM Host</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Offline Compatible</span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-sm text-emerald-400 shadow-xl">
              <div className="absolute top-3 right-3 text-[10px] text-slate-600 uppercase tracking-widest font-black">Self-Hosted Flags</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runLocalLLM}</pre>
              <button 
                onClick={() => handleCopy(codeSnippets.runLocalLLM, 'runLocalLLM')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
              >
                {copiedText === 'runLocalLLM' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Flag Reference & Configuration */}
      <section className="max-w-5xl mx-auto w-full bg-slate-900 dark:bg-[#090d16] rounded-[2.5rem] p-8 md:p-14 text-white border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">CLI Options and Flags</h3>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">Fine-tune scanning metrics, target endpoints, and LLM providers.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                  <th className="py-4 pr-6">Flag</th>
                  <th className="py-4 pr-6">Shorthand</th>
                  <th className="py-4 pr-6">Default</th>
                  <th className="py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-indigo-400 font-bold">--path</td>
                  <td className="py-4 pr-6 font-mono">-p</td>
                  <td className="py-4 pr-6 font-mono">"."</td>
                  <td className="py-4 text-slate-400">Path to target directory containing HCL files.</td>
                </tr>
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-indigo-400 font-bold">--endpoint</td>
                  <td className="py-4 pr-6 font-mono">-e</td>
                  <td className="py-4 pr-6 font-mono">"http://localhost:8080/api/audit"</td>
                  <td className="py-4 text-slate-400">The URL of the DRA Backend API server. The CLI sends Terraform HCL code payloads to this endpoint for parsing, DLP anonymization, and scoring.</td>
                </tr>
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-indigo-400 font-bold">--deep-scan</td>
                  <td className="py-4 pr-6 font-mono">-d</td>
                  <td className="py-4 pr-6 font-mono">false</td>
                  <td className="py-4 text-slate-400">Recursively scan all subdirectory files.</td>
                </tr>
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-amber-400 font-bold">--llm-provider</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4 text-slate-400">Instructs the DRA backend to use a specific model provider (e.g. <code className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-300 font-mono">gemini</code>, <code className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-300 font-mono">ollama</code>, <code className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-300 font-mono">lm-studio</code>).</td>
                </tr>
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-amber-400 font-bold">--llm-model</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4 text-slate-400">Overrides the default LLM model name inside the chosen provider (e.g. <code className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-300 font-mono">gemini-3.5-flash</code>, <code className="bg-slate-850 px-1.5 py-0.5 rounded text-amber-300 font-mono">gemma4:e2b</code>).</td>
                </tr>
                <tr className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 pr-6 font-mono text-amber-400 font-bold">--llm-url</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4 text-slate-400">The endpoint URL of your local, self-hosted LLM server. The DRA Backend API (specified by <code className="text-indigo-400 font-mono">--endpoint</code>) will route queries to this local server instead of Gemini.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Auth note */}
      <div className="max-w-5xl mx-auto w-full p-8 rounded-[2rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/30 flex flex-col lg:flex-row gap-6 items-center justify-between shadow-lg">
        <div className="flex gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 shrink-0 mt-0.5">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">GCP IAM Authorization</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              If running in Cloud Run, authentication is enforced. Set the <code className="bg-slate-200 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">GCP_IAM_TOKEN</code> environment variable before scanning.
            </p>
          </div>
        </div>
        <div className="relative bg-slate-950 p-4 pr-14 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 self-stretch lg:self-auto flex items-center shadow-inner min-w-[340px]">
          <pre className="overflow-x-auto whitespace-pre-wrap flex-1">{codeSnippets.envToken}</pre>
          <button 
            onClick={() => handleCopy(codeSnippets.envToken, 'envToken')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
          >
            {copiedText === 'envToken' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
