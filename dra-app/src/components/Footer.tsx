import React from 'react';
import { Github, Linkedin, ExternalLink, Cpu, ShieldCheck, Coins, Database } from 'lucide-react';
import { Logo } from './Logo';
import { AuditResult, formatModelDisplayName, GEMINI_MODEL } from '../types';

interface FooterProps {
  lastResult: AuditResult | null;
}

export const Footer: React.FC<FooterProps> = ({ lastResult }) => {
  const formattedModelName = formatModelDisplayName(lastResult?.model || GEMINI_MODEL);

  // Approximate token cost estimate (Gemini 4 Hydrogen / Flash tier: ~$0.30/1M in, $2.50/1M out)
  const calculateCost = () => {
    if (!lastResult?.usage) return null;
    const inputCost = (lastResult.usage.promptTokenCount / 1_000_000) * 0.3;
    const outputCost = (lastResult.usage.candidatesTokenCount / 1_000_000) * 2.5;
    return (inputCost + outputCost).toFixed(5);
  };

  const estimatedCost = calculateCost();

  return (
    <footer className="w-full mt-auto border-t border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-[#080d19]/90 backdrop-blur-xl">
      <div className="px-6 sm:px-8 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Brand & Engine Telemetry */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" animate={false} />
              <div>
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Deployment Readiness Auditor <span className="text-blue-600 dark:text-sky-400">v3.1</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Community Open-Source Governance Platform (MIT) • Not an official Google product
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
              <span>Active Model:</span>
              <span className="font-bold text-blue-700 dark:text-sky-300">{formattedModelName}</span>
            </div>

            {lastResult?.usage && (
              <div className="tabular-nums inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                  {lastResult.usage.totalTokenCount.toLocaleString()} tok
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  ${estimatedCost}
                </span>
              </div>
            )}
          </div>

          {/* Right: Links & Privacy Guarantees */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Zero-Knowledge DLP
            </span>

            <a
              href="https://docs.cloud.google.com/architecture/framework"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
            >
              GCP Well-Architected
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <a
                href="https://github.com/damian-sztankowski/Deployment-Readiness-Auditor"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/damian-sztankowski/"
                target="_blank"
                rel="noreferrer"
                aria-label="Author LinkedIn profile"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
