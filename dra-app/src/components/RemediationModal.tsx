import React, { useState } from 'react';
import { Finding } from '../types';
import { generateRemediationBundle, downloadTextFile } from '../services/remediationService';
import { X, Copy, Check, Download, GitPullRequest, FileCode, Terminal, CheckCircle2 } from 'lucide-react';

interface RemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: Finding[];
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  isOpen,
  onClose,
  findings
}) => {
  const [activeTab, setActiveTab] = useState<'patch' | 'hcl'>('patch');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bundle = generateRemediationBundle(findings);

  const currentContent = activeTab === 'patch' ? bundle.patchContent : bundle.remediatedCodeContent;
  const currentFilename = activeTab === 'patch' ? 'dra-remediation.patch' : 'remediated-infrastructure.tf';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(currentFilename, currentContent);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-slate-900/85 backdrop-blur-md" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#0a0f1e] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#111827]/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <GitPullRequest className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Automated Remediation Bundle
                </h3>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {bundle.totalFixesCount} Fixes Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                One-click export of verified HCL remediations and patch sets.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-8 pt-4 pb-2 bg-slate-50/40 dark:bg-[#111827]/30 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('patch')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'patch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Git Patch (.patch)
            </button>

            <button
              onClick={() => setActiveTab('hcl')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'hcl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Consolidated HCL (.tf)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download {activeTab === 'patch' ? '.patch' : '.tf'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 flex-1 overflow-auto space-y-4">
          {activeTab === 'patch' && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-indigo-500" />
                <span>Apply this patch to your repository with Git:</span>
              </div>
              <code className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800 font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                git apply dra-remediation.patch
              </code>
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-inner">
            <pre className="p-6 text-xs md:text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[480px]">
              {currentContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-[#111827]/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Tested against Google Cloud Architecture Framework best practices.
          </span>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
