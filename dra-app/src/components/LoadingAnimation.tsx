import React, { useState, useEffect } from 'react';
import { Bot, Search, Zap, Cloud, Terminal, CheckCircle2 } from 'lucide-react';
import { AuditStageEvent } from '../types';

const FUNNY_MESSAGES = [
  'Scrubbing secrets via Bidirectional Client-Side DLP...',
  'Parsing HCL & Kubernetes AST resource blocks...',
  'Verifying CIS GCP Benchmark v2.0 & NIST 800-53 controls...',
  'Calculating regional GCP Cloud Billing SKUs...',
  'Tracing cross-resource VPC & IAM blast-radius paths...',
  'Evaluating .dra.yaml organization guardrails & waivers...'
];

interface LoadingAnimationProps {
  stageEvent?: AuditStageEvent | null;
}

const PIPELINE_STEPS: Array<{ key: AuditStageEvent['stage']; label: string }> = [
  { key: 'dlp', label: 'DLP Redaction' },
  { key: 'static', label: 'Static AST' },
  { key: 'finops', label: 'FinOps SKUs' },
  { key: 'policy', label: 'Org Policy' },
  { key: 'ai', label: 'AI Synthesis' }
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ stageEvent }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const progress = stageEvent?.progress ?? 20;
  const activeLabel = stageEvent?.label || FUNNY_MESSAGES[messageIndex];
  const currentIdx = stageEvent
    ? PIPELINE_STEPS.findIndex((s) => s.key === stageEvent.stage)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 w-full overflow-hidden">
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 blur-xl opacity-20 rounded-full animate-pulse" />

        <div className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-lg shadow-indigo-500/10 border border-indigo-50 dark:border-indigo-900 flex items-center justify-center z-10">
          <div className="relative">
            <Bot
              className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-bounce"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>

          <div className="absolute -top-3 -right-3 animate-bounce">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-md border border-amber-100 dark:border-amber-900/30 rotate-12">
              <Zap className="w-4 h-4 text-amber-400 fill-current" aria-hidden="true" />
            </div>
          </div>
          <div className="absolute -bottom-3 -left-3 animate-bounce">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-md border border-emerald-100 dark:border-emerald-900/30 -rotate-12">
              <Search className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
          </div>
          <div className="absolute top-1/2 -right-10 animate-pulse">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-80">
              <Cloud className="w-4 h-4 text-sky-400" aria-hidden="true" />
            </div>
          </div>
          <div className="absolute top-0 -left-8 animate-pulse">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-60">
              <Terminal className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 max-w-2xl w-full px-6">
        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white">
          {activeLabel}
        </h3>

        <div className="w-full max-w-md mx-auto space-y-2">
          <progress
            value={progress}
            max={100}
            aria-label="Audit pipeline progress"
            className="w-full h-2 rounded-full overflow-hidden accent-indigo-600"
          />
          <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {PIPELINE_STEPS.map((step, idx) => {
              const done = idx < currentIdx || stageEvent?.stage === 'complete';
              const active = idx === currentIdx;
              return (
                <span
                  key={step.key}
                  className={`flex items-center gap-1 ${
                    done
                      ? 'text-emerald-500'
                      : active
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'opacity-50'
                  }`}
                >
                  {done && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
