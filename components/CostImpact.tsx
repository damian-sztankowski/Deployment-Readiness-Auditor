import React, { useState, useMemo } from 'react';
import { TrendingDown, ArrowRight, PiggyBank, Sparkles, X, Target, Wand2, FileCode, Copy, Check, Calculator } from 'lucide-react';
import { Finding } from '../types';

interface CostImpactProps {
  findings: Finding[];
}

export const CostImpact: React.FC<CostImpactProps> = ({ findings }) => {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);

  // Strict filter for FinOps specific findings
  const costFindings = useMemo(() => {
    return findings.filter(f => {
      if (!f.costSavings) return false;
      
      const category = f.category.toLowerCase();
      const savings = f.costSavings.toLowerCase();
      
      return (
        (category.includes('cost') || category.includes('finops')) &&
        !savings.includes('n/a') &&
        !savings.includes('none') &&
        savings.trim().length > 0
      );
    });
  }, [findings]);

  // Calculate total monthly savings
  const totalMonthlySavings = useMemo(() => {
    return costFindings.reduce((total, finding) => {
      // Improved regex to find numbers following a dollar sign
      const match = finding.costSavings?.match(/\$(\d+(\.\d+)?)/);
      if (match && match[1]) {
        return total + parseFloat(match[1]);
      }
      return total;
    }, 0);
  }, [costFindings]);

  if (costFindings.length === 0) return null;

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFinding?.fix) {
        navigator.clipboard.writeText(selectedFinding.fix);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="w-full mb-8 animate-enter">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-emerald-50/80 dark:from-emerald-950/30 dark:via-teal-900/10 dark:to-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 p-6 md:p-8 shadow-sm backdrop-blur-sm">
          
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-screen"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
                  <div className="relative p-3 bg-white dark:bg-slate-900 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-800">
                      <PiggyBank className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 text-amber-400 animate-pulse">
                      <Sparkles className="w-4 h-4 fill-current" />
                  </div>
               </div>
               <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      FinOps Opportunities
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Identified <span className="font-bold text-emerald-600 dark:text-emerald-400">{costFindings.length} optimizations</span> to reclaim your GCP budget.
                  </p>
               </div>
            </div>

            {/* TOTAL SAVINGS DISPLAY */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center gap-4 group">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                   <Calculator className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Potential Savings</p>
                   <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
                      ${totalMonthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-sm font-bold opacity-60 ml-1">/mo</span>
                   </p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
              {costFindings.map((finding) => (
                  <button 
                    key={finding.id} 
                    onClick={() => setSelectedFinding(finding)}
                    className="text-left flex flex-col bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 group cursor-pointer relative overflow-hidden h-full"
                  >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex items-start justify-between mb-4 w-full">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                               <TrendingDown className="w-5 h-5" />
                          </div>
                           <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20 shadow-sm truncate max-w-[60%] text-center ml-2" title={finding.costSavings}>
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
                           <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 max-w-[70%] truncate">
                              {finding.fileName ? (
                                  <>
                                      <span className="truncate">{finding.fileName}</span>
                                      {finding.lineNumber && <span className="text-slate-300 dark:text-slate-600 shrink-0">|</span>}
                                      {finding.lineNumber && <span className="shrink-0">L{finding.lineNumber}</span>}
                                  </>
                              ) : <span>Project Level</span>}
                           </div>
                           
                           <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
                              Details <ArrowRight className="w-3.5 h-3.5" />
                           </div>
                      </div>
                  </button>
              ))}
          </div>
        </div>
      </div>

      {selectedFinding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
           <div 
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setSelectedFinding(null)}
           />

           <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-enter max-h-[90vh]">
              
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10 flex justify-between items-start gap-4">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          {selectedFinding.costSavings}
                       </span>
                       {selectedFinding.fileName && (
                          <span className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                             <FileCode className="w-3 h-3" />
                             {selectedFinding.fileName}:{selectedFinding.lineNumber}
                          </span>
                       )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                       {selectedFinding.title}
                    </h3>
                 </div>
                 <button 
                    onClick={() => setSelectedFinding(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">FinOps Analysis</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                       {selectedFinding.description}
                    </p>
                 </div>

                 <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                       <Target className="w-4 h-4 text-indigo-500" />
                       Action Plan
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                       {selectedFinding.remediation}
                    </p>
                 </div>

                 {selectedFinding.fix && (
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                             <Wand2 className="w-4 h-4 text-emerald-500" />
                             Terraform Change
                          </h4>
                          <button 
                             onClick={handleCopyFix}
                             className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                          >
                             {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                             {copied ? 'Copied' : 'Copy Code'}
                          </button>
                       </div>
                       <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-inner p-4 overflow-x-auto">
                          <pre className="text-sm font-mono text-emerald-300 leading-relaxed">
                             {selectedFinding.fix}
                          </pre>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                 <button 
                    onClick={() => setSelectedFinding(null)}
                    className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm"
                 >
                    Close Details
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};