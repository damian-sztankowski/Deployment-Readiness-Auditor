import React, { useState } from 'react';
import { 
  Terminal, Play, Cpu, Server, Key, ShieldCheck, 
  Copy, Check, ArrowRight, BookOpen, Settings, HelpCircle, Code
} from 'lucide-react';

export const CliInfo: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">Command Line Interface</h3>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">DRA CLI Command Center</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Integrate the Deployment Readiness Auditor directly into your local terminals, scripts, and CI/CD pipelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Step 1: Compilation */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight mb-2">1. Build CLI Tool</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Build the standalone Go binary from source directly in the project workspace.
            </p>
          </div>
          <div className="relative bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400">
            <pre className="overflow-x-auto">{codeSnippets.build}</pre>
            <button 
              onClick={() => handleCopy(codeSnippets.build, 'build')}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              {copiedText === 'build' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Step 2: Running Scan */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Play className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight mb-2">2. Execute Audit</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Scan a target folder containing Terraform HCL config files against the Well-Architected Framework.
            </p>
          </div>
          <div className="relative bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400">
            <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runSimple}</pre>
            <button 
              onClick={() => handleCopy(codeSnippets.runSimple, 'runSimple')}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              {copiedText === 'runSimple' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Step 3: Self-Hosted Engine */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <Server className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight mb-2">3. Self-Hosted LLMs</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Audit locally using Ollama or another self-hosted model, skipping GCP token checks.
            </p>
          </div>
          <div className="relative bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400">
            <pre className="overflow-x-auto whitespace-pre-wrap">{codeSnippets.runLocalLLM}</pre>
            <button 
              onClick={() => handleCopy(codeSnippets.runLocalLLM, 'runLocalLLM')}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              {copiedText === 'runLocalLLM' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Flag Reference & Configuration */}
      <section className="max-w-5xl mx-auto w-full bg-slate-900 dark:bg-black rounded-[3rem] p-8 md:p-16 text-white border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-400" />
            <h3 className="text-2xl font-black tracking-tight">CLI Options and Flags</h3>
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
              <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                <tr>
                  <td className="py-4 pr-6 font-mono text-indigo-400">--path</td>
                  <td className="py-4 pr-6 font-mono">-p</td>
                  <td className="py-4 pr-6 font-mono">"."</td>
                  <td className="py-4">Path to target directory containing HCL files.</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 font-mono text-indigo-400">--endpoint</td>
                  <td className="py-4 pr-6 font-mono">-e</td>
                  <td className="py-4 pr-6 font-mono">"http://localhost:8080/api/audit"</td>
                  <td className="py-4">URL endpoint to hit for auditor server.</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 font-mono text-indigo-400">--deep-scan</td>
                  <td className="py-4 pr-6 font-mono">-d</td>
                  <td className="py-4 pr-6 font-mono">false</td>
                  <td className="py-4">Recursively scan all subdirectory files.</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 font-mono text-amber-400">--llm-provider</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4">Override default LLM provider (e.g. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">gemini</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">ollama</code>).</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 font-mono text-amber-400">--llm-model</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4">Override default model name (e.g. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">gemma4:e2b</code>).</td>
                </tr>
                <tr>
                  <td className="py-4 pr-6 font-mono text-amber-400">--llm-url</td>
                  <td className="py-4 pr-6 font-mono">-</td>
                  <td className="py-4 pr-6 font-mono">""</td>
                  <td className="py-4">Self-hosted LLM generate endpoint URL.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Auth note */}
      <div className="max-w-5xl mx-auto w-full p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex gap-4">
          <Key className="w-8 h-8 text-indigo-500 shrink-0 mt-1" />
          <div>
            <h4 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">GCP IAM Authorization</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
              If running in Cloud Run, authentication is enforced. Set the <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">GCP_IAM_TOKEN</code> environment variable before scanning.
            </p>
          </div>
        </div>
        <div className="relative bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-400 self-stretch md:self-auto flex items-center justify-between gap-4">
          <pre>{codeSnippets.envToken}</pre>
          <button 
            onClick={() => handleCopy(codeSnippets.envToken, 'envToken')}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            {copiedText === 'envToken' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
