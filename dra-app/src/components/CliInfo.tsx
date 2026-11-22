import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Cpu,
  Server,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Settings,
  RefreshCw,
  Command,
  GitBranch
} from 'lucide-react';

export const CliInfo: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [terminalState, setTerminalState] = useState<
    'idle' | 'typing' | 'loading' | 'completed'
  >('idle');
  const [typedCommand, setTypedCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'build' | 'scan' | 'delta' | 'self-hosted'>('build');
  const [loadingFrame, setLoadingFrame] = useState(0);

  const fullCommand =
    'dra-cli scan --path ./infra/terraform --policy .dra.yaml --fail-on critical,high --fix-patch fix.patch';
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (terminalState === 'loading') {
      interval = setInterval(() => {
        setLoadingFrame((prev) => (prev + 1) % spinnerFrames.length);
      }, 90);
    }
    return () => clearInterval(interval);
  }, [terminalState, spinnerFrames.length]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (terminalState === 'typing') {
      let index = 0;
      setTypedCommand('');
      const interval = setInterval(() => {
        if (index < fullCommand.length) {
          setTypedCommand((prev) => prev + fullCommand[index]);
          index++;
        } else {
          clearInterval(interval);
          timer = setTimeout(() => {
            setTerminalState('loading');
          }, 450);
        }
      }, 28);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else if (terminalState === 'loading') {
      timer = setTimeout(() => {
        setTerminalState('completed');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [terminalState]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippets = {
    build: 'make -C dra-cli test build\n./dra-cli/bin/dra-cli version',
    runSimple:
      './dra-cli/bin/dra-cli scan \\\n  --path ./terraform \\\n  --deep-scan --yes \\\n  --policy .dra.yaml \\\n  --fail-on critical,high \\\n  --min-score 75 \\\n  --fix-patch dra-remediation.patch',
    runDelta:
      '# Scan only Git-modified IaC files in a PR & emit sticky PR Markdown:\n./dra-cli/bin/dra-cli scan \\\n  --path . \\\n  --changed-only \\\n  --base origin/production \\\n  --output github-pr \\\n  --output-file dra-pr-comment.md',
    runLocalLLM:
      '# Option A: Zero-Key Deterministic AST Engine (instant, $0):\n./dra-cli/bin/dra-cli scan --path ./terraform --llm-provider static\n\n# Option B: Local Air-Gapped Ollama:\n./dra-cli/bin/dra-cli scan \\\n  --path ./terraform \\\n  --llm-provider ollama \\\n  --llm-model gemma4:e2b \\\n  --llm-url http://localhost:11434/api/generate',
    envToken:
      'export GCP_IAM_TOKEN=$(gcloud auth print-identity-token)\n./dra-cli/bin/dra-cli scan --path . --endpoint https://dra.example.run.app/api/audit'
  };

  const cliFlags = [
    { flag: '--path', short: '-p', def: '"."', desc: 'File or directory containing .tf, .tofu, tfplan.json, K8s .yaml, or Dockerfile.' },
    { flag: '--endpoint', short: '-e', def: '"http://localhost:8080/api/audit"', desc: 'DRA Backend API endpoint (or set DRA_ENDPOINT).' },
    { flag: '--deep-scan', short: '-d', def: 'false', desc: 'Recursively scan subdirectories (skips .git, node_modules, dist).' },
    { flag: '--changed-only', short: '-', def: 'false', desc: 'PR Delta Mode: scan only Git-modified IaC files relative to --base.' },
    { flag: '--base', short: '-', def: '"HEAD~1"', desc: 'Base Git ref used with --changed-only (e.g. origin/production).' },
    { flag: '--policy', short: '-', def: 'auto (.dra.yaml)', desc: 'Path to .dra.yaml organization policy & time-bounded waivers file.' },
    { flag: '--fail-on', short: '-', def: '""', desc: 'Exit with code 1 if active findings match severities (e.g. critical,high).' },
    { flag: '--min-score', short: '-', def: '0', desc: 'Exit with code 1 if any Well-Architected pillar score drops below threshold (0-100).' },
    { flag: '--output', short: '-o', def: '"console"', desc: 'Output format: console, json, sarif, markdown, github-pr.' },
    { flag: '--output-file', short: '-', def: '""', desc: 'Write formatted report (SARIF 2.1.0, PR Markdown, JSON) to disk.' },
    { flag: '--fix-patch', short: '-', def: '""', desc: 'Generate a git apply --check verified POSIX unified diff (.patch).' },
    { flag: '--llm-provider', short: '-', def: '""', desc: 'Engine provider: gemini, static (zero-key AST), ollama, lm-studio.' },
    { flag: '--llm-model', short: '-', def: '""', desc: 'Model override (e.g. gemini-4-hydrogen, gemini-4-carbon, gemini-3.8-flash, gemma4:e2b).' },
    { flag: '--llm-url', short: '-', def: '""', desc: 'Local self-hosted LLM URL (permitted in local dev; blocked by SSRF guard on Cloud Run).' },
    { flag: '--dlp', short: '-', def: 'true', desc: 'Run bidirectional client-side DLP before transmitting payloads.' },
    { flag: '--no-color', short: '-', def: 'false', desc: 'Disable ANSI colors & spinner (auto-detected when NO_COLOR, CI=true, or non-TTY).' },
    { flag: '--timeout', short: '-', def: '120', desc: 'HTTP timeout in seconds (includes automatic 429 Retry-After backoff).' },
    { flag: '--demo', short: '-', def: 'false', desc: 'Run simulated offline showcase report for pipeline smoke tests.' }
  ];

  return (
    <div className="animate-enter space-y-16 py-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-sky-500/20 text-blue-700 dark:text-sky-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
          <Command className="w-3.5 h-3.5" aria-hidden="true" />
          dra-cli v3.1.0 • POSIX &amp; CI/CD Native
        </div>
        <h1
          id="main-heading"
          tabIndex={-1}
          className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none"
        >
          DRA CLI Command Center
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Gatekeep pull requests with client-side DLP, Git delta scanning,{' '}
          <code className="text-blue-600 dark:text-sky-400">.dra.yaml</code> waivers, SARIF 2.1.0 alerts, and verified <code>git apply</code> patches.
        </p>
      </div>

      {/* Interactive Terminal Simulator */}
      <div className="max-w-4xl mx-auto w-full px-2">
        <div className="bg-[#0b0f19] rounded-[2rem] border border-slate-800 shadow-2xl shadow-indigo-950/20 overflow-hidden relative">
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3.5 h-3.5 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-4 font-mono text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                zsh — dra-cli v3.0.0
              </span>
            </div>
            <div>
              {terminalState !== 'typing' && terminalState !== 'loading' && (
                <button
                  type="button"
                  onClick={() => setTerminalState('typing')}
                  className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg transition-all text-[10px] uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  Simulate v3.0 Scan
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 font-mono text-[12px] text-slate-300 leading-relaxed overflow-x-auto min-h-[440px] max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-black">dev@macbook</span>
              <span className="text-slate-500">~/cloud-infra</span>
              <span className="text-indigo-400 font-black">%</span>
              <span>
                {terminalState === 'idle' && (
                  <span className="text-slate-500 italic">
                    Click &quot;Simulate v3.0 Scan&quot; to preview Hybrid AST + FinOps + DLP terminal output...
                  </span>
                )}
                {terminalState === 'typing' && (
                  <span>
                    {typedCommand}
                    <span className="inline-block w-1.5 h-4 bg-slate-400 animate-pulse ml-0.5" />
                  </span>
                )}
                {terminalState !== 'idle' && terminalState !== 'typing' && (
                  <span className="text-white">{fullCommand}</span>
                )}
              </span>
            </div>

            {terminalState === 'loading' && (
              <div className="mt-4 text-indigo-300 flex items-center gap-2">
                <span className="font-bold text-emerald-400">{spinnerFrames[loadingFrame]}</span>
                <span>Auditing AST blocks, FinOps SKUs, and compliance controls...</span>
              </div>
            )}

            {terminalState === 'completed' && (
              <div className="mt-4 space-y-4 animate-enter">
                <div className="text-indigo-400 font-bold">
                  ====================================================
                  <br />
                  &nbsp;&nbsp;&nbsp;Deployment Readiness Auditor (DRA) CLI v3.0.0
                  <br />
                  ====================================================
                </div>
                <div className="text-slate-300">
                  📦 Auditing 4 file(s) (6 sensitive fields scrubbed locally) -&gt; http://localhost:8080/api/audit
                </div>

                <div className="text-indigo-400 font-bold mt-4">
                  ====================================================
                  <br />
                  📊 AUDIT RUN SUMMARY
                  <br />
                  ====================================================
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                  <div>
                    🔍 Files Audited : <span className="font-bold text-white">4</span>
                  </div>
                  <div>
                    🔴 Critical Risks: <span className="font-bold text-red-500">1</span>
                  </div>
                  <div>
                    🟠 High Risks &nbsp;&nbsp;&nbsp;: <span className="font-bold text-yellow-500">1</span>
                  </div>
                  <div>
                    ⚖️ Waived Risks &nbsp;: <span className="font-bold text-cyan-400">1 (.dra.yaml)</span>
                  </div>
                  <div className="md:col-span-2 text-emerald-400 font-bold">
                    💰 FinOps Waste &nbsp;: $124.08/mo ($1488.96/yr) in us-central1
                  </div>
                </div>
                <div className="text-indigo-400 font-bold">
                  ====================================================
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-white font-bold">
                    📊 ARCHITECTURE PILLAR SCORES (Google Cloud Framework):
                  </div>
                  <div className="pl-3 space-y-1.5 text-[11px]">
                    <div>
                      [<span className="text-red-500 font-bold">✘</span>] Security &amp; Compliance &nbsp;|{' '}
                      <span className="text-red-500">████████░░░░░░░░░░░░</span> 42/100
                    </div>
                    <div>
                      [<span className="text-yellow-400 font-bold">!</span>] Cost Optimization &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|{' '}
                      <span className="text-yellow-400">█████████████░░░░░░░</span> 65/100
                    </div>
                    <div>
                      [<span className="text-emerald-400 font-bold">✔</span>] Reliability &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|{' '}
                      <span className="text-emerald-400">██████████████████░░</span> 90/100
                    </div>
                  </div>
                </div>

                <div className="text-emerald-400 pt-2">
                  🩹 Verified Git patch written to: fix.patch (Apply with: git apply fix.patch)
                </div>
                <div className="text-red-400 font-bold">
                  ❌ DRA CI/CD QUALITY GATE: FAILED (1 Critical, 1 High detected — exit code 1)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Snippet Tabs */}
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'build', label: '1. Test & Build' },
            { id: 'scan', label: '2. Policy & Patch Gate' },
            { id: 'delta', label: '3. Git PR Delta & PR Bot' },
            { id: 'self-hosted', label: '4. Offline AST & Ollama' }
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-4 px-5 font-black text-xs md:text-sm uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'build' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Compile &amp; Test Standalone Binary
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Run the Go race-detector test suite and compile a zero-dependency native binary (or publish multi-arch archives via <code>.goreleaser.yaml</code>).
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Go 1.22+
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" /> Race-Tested
                </span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-xs md:text-sm text-emerald-400 shadow-xl">
              <pre className="overflow-x-auto whitespace-pre">{codeSnippets.build}</pre>
              <button
                type="button"
                aria-label="Copy build snippet"
                onClick={() => handleCopy(codeSnippets.build, 'build')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                {copiedText === 'build' ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Enforce .dra.yaml Gates &amp; Export Patches
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Scrub sensitive identifiers client-side, evaluate <code>.dra.yaml</code> guardrails &amp; waivers, enforce minimum pillar scores, and write a verified <code>git apply</code> patch.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Client-Side DLP
                </span>
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-500" aria-hidden="true" /> Verified .patch
                </span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-xs md:text-sm text-emerald-400 shadow-xl">
              <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runSimple}</pre>
              <button
                type="button"
                aria-label="Copy scan snippet"
                onClick={() => handleCopy(codeSnippets.runSimple, 'runSimple')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                {copiedText === 'runSimple' ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'delta' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Monorepo PR Delta &amp; Sticky PR Comments
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Use <code>--changed-only</code> to audit only files modified in the current branch/PR, cutting LLM latency &amp; token spend by up to 90%, and render collapsible Mermaid + HCL suggestions with <code>--output github-pr</code>.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Git Diff Aware
                </span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-xs md:text-sm text-emerald-400 shadow-xl">
              <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runDelta}</pre>
              <button
                type="button"
                aria-label="Copy delta scan snippet"
                onClick={() => handleCopy(codeSnippets.runDelta, 'runDelta')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                {copiedText === 'runDelta' ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'self-hosted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-enter">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Zero-Key Offline AST &amp; Local Ollama
              </h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                Run 100% deterministic static + FinOps audits with <code>--llm-provider static</code>, or route to local Ollama / LM Studio instances in development.
              </p>
              <div className="flex gap-4 items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-500" aria-hidden="true" /> Air-Gapped Ready
                </span>
              </div>
            </div>
            <div className="relative bg-slate-950 p-6 rounded-3xl border border-slate-800 font-mono text-xs md:text-sm text-emerald-400 shadow-xl">
              <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runLocalLLM}</pre>
              <button
                type="button"
                aria-label="Copy local LLM snippet"
                onClick={() => handleCopy(codeSnippets.runLocalLLM, 'runLocalLLM')}
                className="absolute bottom-4 right-4 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              >
                {copiedText === 'runLocalLLM' ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complete v3.0 Flag Reference */}
      <section className="max-w-5xl mx-auto w-full bg-slate-900 dark:bg-[#090d16] rounded-[2.5rem] p-8 md:p-14 text-white border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <Settings className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">
                Complete dra-cli v3.0 Flag Reference
              </h3>
              <p className="text-slate-400 text-sm mt-0.5 font-medium">
                All 18 flags supported by <code>dra-cli scan</code>.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-black">
                  <th className="py-3.5 pr-4">Flag</th>
                  <th className="py-3.5 pr-4">Short</th>
                  <th className="py-3.5 pr-4">Default</th>
                  <th className="py-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {cliFlags.map((row) => (
                  <tr key={row.flag} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3.5 pr-4 font-mono text-indigo-400 font-bold whitespace-nowrap">
                      {row.flag}
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-slate-400">{row.short}</td>
                    <td className="py-3.5 pr-4 font-mono text-amber-300 whitespace-nowrap">
                      {row.def}
                    </td>
                    <td className="py-3.5 text-slate-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* OIDC Auth Note */}
      <div className="max-w-5xl mx-auto w-full p-8 rounded-[2rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 dark:border-indigo-500/30 flex flex-col lg:flex-row gap-6 items-center justify-between shadow-lg">
        <div className="flex gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 shrink-0 mt-0.5">
            <Key className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Cloud Run OIDC &amp; Workload Identity Auth
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              Hosted Cloud Run instances verify Google OIDC identity tokens (audience &amp; domain checked via <code>google-auth-library</code>) or <code>DRA_API_KEY</code>.
            </p>
          </div>
        </div>
        <div className="relative bg-slate-950 p-4 pr-14 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-400 self-stretch lg:self-auto flex items-center shadow-inner min-w-[320px]">
          <pre className="overflow-x-auto whitespace-pre-wrap flex-1">{codeSnippets.envToken}</pre>
          <button
            type="button"
            aria-label="Copy OIDC auth snippet"
            onClick={() => handleCopy(codeSnippets.envToken, 'envToken')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          >
            {copiedText === 'envToken' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
