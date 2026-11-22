import React, { useMemo, useState } from 'react';
import { diffLines } from 'diff';
import { Finding } from '../types';
import { generateRemediationBundle, downloadTextFile } from '../services/remediationService';
import {
  Copy,
  Check,
  Download,
  GitPullRequest,
  FileCode,
  Terminal,
  CheckCircle2,
  Columns2
} from 'lucide-react';
import { ModalDialog } from './ModalDialog';

interface RemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: Finding[];
  originalCode?: string;
}

export const RemediationModal: React.FC<RemediationModalProps> = ({
  isOpen,
  onClose,
  findings,
  originalCode
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'patch' | 'hcl'>('diff');
  const [copied, setCopied] = useState(false);

  const bundle = useMemo(
    () => generateRemediationBundle(findings, originalCode),
    [findings, originalCode]
  );

  const currentContent =
    activeTab === 'hcl' ? bundle.remediatedCodeContent : bundle.patchContent;
  const currentFilename =
    activeTab === 'hcl' ? 'remediated-infrastructure.tf' : 'dra-remediation.patch';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(currentFilename, currentContent);
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Remediation Bundle"
      subtitle={`${bundle.totalFixesCount} verified fix(es) — POSIX unified git patch & side-by-side diff`}
      icon={<GitPullRequest className="w-6 h-6" />}
      maxWidthClass="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            Verified unified diff headers (`--- a/...`, `+++ b/...`) compatible with `git apply`.
          </span>
          <form method="dialog">
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
            >
              Close
            </button>
          </form>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'diff'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
              }`}
            >
              <Columns2 className="w-4 h-4" aria-hidden="true" />
              Side-by-Side Diff
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('patch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'patch'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" aria-hidden="true" />
              Git Patch (.patch)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hcl')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'hcl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4" aria-hidden="true" />
              Consolidated HCL (.tf)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download {activeTab === 'hcl' ? '.tf' : '.patch'}
            </button>
          </div>
        </div>

        {activeTab === 'diff' ? (
          <div className="space-y-6">
            {bundle.fileDiffs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No automated code diffs available for the current findings.
              </p>
            ) : (
              bundle.fileDiffs.map((fd) => {
                const parts = diffLines(fd.beforeContent, fd.afterContent);
                return (
                  <div
                    key={fd.fileName}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950"
                  >
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="font-bold text-indigo-300">{fd.fileName}</span>
                      <span className="text-[11px] text-emerald-400">
                        {fd.appliedCount} remediation block(s) applied
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 max-h-[420px] overflow-auto text-xs font-mono">
                      <div className="p-4 space-y-0.5 overflow-x-auto">
                        <div className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-2">
                          Before (Audited Input)
                        </div>
                        {parts
                          .filter((p) => !p.added)
                          .map((part, idx) => (
                            <pre
                              key={idx}
                              className={`whitespace-pre-wrap px-2 py-0.5 rounded ${
                                part.removed
                                  ? 'bg-rose-500/15 text-rose-300 border-l-2 border-rose-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              <code>{part.value.replace(/\n$/, '')}</code>
                            </pre>
                          ))}
                      </div>
                      <div className="p-4 space-y-0.5 overflow-x-auto">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
                          After (DRA Remediated)
                        </div>
                        {parts
                          .filter((p) => !p.removed)
                          .map((part, idx) => (
                            <pre
                              key={idx}
                              className={`whitespace-pre-wrap px-2 py-0.5 rounded ${
                                part.added
                                  ? 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500'
                                  : 'text-slate-300'
                              }`}
                            >
                              <code>{part.value.replace(/\n$/, '')}</code>
                            </pre>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'patch' && (
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                <span className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  Apply cleanly to your Git working tree:
                </span>
                <code className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800 font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                  git apply --check dra-remediation.patch &amp;&amp; git apply dra-remediation.patch
                </code>
              </div>
            )}

            <pre
              role="region"
              aria-label={activeTab === 'patch' ? 'Unified Git patch output' : 'Consolidated HCL remediation code'}
              tabIndex={0}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-xs md:text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[460px]"
            >
              <code>{currentContent}</code>
            </pre>
          </div>
        )}
      </div>
    </ModalDialog>
  );
};
