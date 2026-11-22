import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  ArrowRight,
  PiggyBank,
  Sparkles,
  Target,
  Wand2,
  FileCode,
  Copy,
  Check,
  Calculator,
  Globe
} from 'lucide-react';
import { Finding, FinOpsSummary } from '../types';
import { ModalDialog } from './ModalDialog';

interface CostImpactProps {
  findings: Finding[];
  finops?: FinOpsSummary;
}

export const CostImpact: React.FC<CostImpactProps> = ({ findings, finops }) => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);

  const costFindings = useMemo(() => {
    return findings.filter((f) => {
      if (!f.costSavings) return false;
      const savings = f.costSavings.toLowerCase();
      return !savings.includes('n/a') && !savings.includes('none') && savings.trim().length > 0;
    });
  }, [findings]);

  const parsedFindingsSavings = useMemo(() => {
    return costFindings.reduce((total, finding) => {
      if (typeof finding.monthlySavingsUsd === 'number') return total + finding.monthlySavingsUsd;
      const match = finding.costSavings?.match(/\$(\d+(\.\d+)?)/);
      return match && match[1] ? total + parseFloat(match[1]) : total;
    }, 0);
  }, [costFindings]);

  const totalMonthlySavings = Math.max(
    finops?.potentialMonthlySavingsUsd || 0,
    parsedFindingsSavings
  );

  const hasSkuTable = Boolean(finops && finops.lineItems.length > 0);
  if (costFindings.length === 0 && !hasSkuTable) return null;

  const handleCopyFix = () => {
    if (selectedFinding?.fix) {
      navigator.clipboard.writeText(selectedFinding.fix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="w-full mb-8 animate-enter">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-emerald-50/80 dark:from-emerald-950/30 dark:via-teal-900/10 dark:to-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 p-6 md:p-8 shadow-sm backdrop-blur-sm space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800">
                <PiggyBank className="w-8 h-8" strokeWidth={1.5} aria-hidden="true" />
                <Sparkles
                  className="w-4 h-4 text-amber-400 fill-current absolute -top-1 -right-1"
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    FinOps Cloud Billing Intelligence
                  </h3>
                  {finops?.region && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-900 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Globe className="w-3 h-3" aria-hidden="true" /> Region: {finops.region}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Regional GCP SKU baseline estimation &amp; right-sizing opportunities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {finops && finops.estimatedCurrentMonthlyUsd > 0 && (
                <div className="bg-white/80 dark:bg-slate-900/80 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Provisioned Baseline
                  </p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                    ${finops.estimatedCurrentMonthlyUsd.toFixed(2)}
                    <span className="text-xs font-bold opacity-60 ml-1">/mo</span>
                  </p>
                </div>
              )}

              <div className="bg-white/80 dark:bg-slate-900/80 px-6 py-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center gap-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                    Reclaimable Waste (${(totalMonthlySavings * 12).toFixed(0)}/yr)
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                    ${totalMonthlySavings.toFixed(2)}
                    <span className="text-sm font-bold opacity-60 ml-1">/mo</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Regional GCP SKU Breakdown Table */}
          {hasSkuTable && finops && (
            <div className="overflow-x-auto rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white/90 dark:bg-slate-950/60 relative z-10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-900/60 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">GCP Billing SKU</th>
                    <th className="py-3 px-4 text-right">Current / mo</th>
                    <th className="py-3 px-4 text-right">Optimized / mo</th>
                    <th className="py-3 px-4 text-right">Savings / mo</th>
                    <th className="py-3 px-4">FinOps Lever</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {finops.lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30 dark:hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {item.resourceAddress}
                        {item.count > 1 && (
                          <span className="ml-1.5 text-[10px] text-indigo-500">×{item.count}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.skuDescription}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        ${item.currentMonthlyUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        ${item.optimizedMonthlyUsd.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {item.savingsMonthlyUsd > 0 ? `-$${item.savingsMonthlyUsd.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {item.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {costFindings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
              {costFindings.map((finding) => (
                <button
                  type="button"
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className="text-left flex flex-col bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all group cursor-pointer h-full"
                >
                  <div className="flex items-start justify-between mb-4 w-full">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                      <TrendingDown className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 truncate max-w-[65%]">
                      {finding.costSavings}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2 leading-tight">
                    {finding.title}
                  </h4>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {finding.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full">
                    <span className="text-xs font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 truncate max-w-[70%]">
                      {finding.fileName || 'main.tf'}
                      {finding.lineNumber ? `:L${finding.lineNumber}` : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Details <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalDialog
        isOpen={Boolean(selectedFinding)}
        onClose={() => setSelectedFinding(null)}
        title={selectedFinding?.title || 'FinOps Optimization'}
        subtitle={selectedFinding?.costSavings}
        icon={<PiggyBank className="w-6 h-6" />}
        maxWidthClass="max-w-2xl"
      >
        {selectedFinding && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                FinOps Analysis ({selectedFinding.fileName || 'main.tf'}:
                {selectedFinding.lineNumber || 1})
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedFinding.description}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                Action Plan
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {selectedFinding.remediation}
              </p>
            </div>

            {selectedFinding.fix && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    Terraform Change
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyFix}
                    className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {copied ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
                <pre
                  role="region"
                  aria-label="FinOps Terraform optimization snippet"
                  tabIndex={0}
                  className="bg-slate-900 rounded-xl border border-slate-700 p-4 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed"
                >
                  <code>{selectedFinding.fix}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </>
  );
};
