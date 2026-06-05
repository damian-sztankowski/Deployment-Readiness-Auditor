import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ChevronDown, Target, ShieldCheck, Wand2, Copy, Check, FileCode, Hash, Banknote, Shield, X, Eye, EyeOff, Landmark, Activity, BookOpen, AlertCircle, Bookmark, Compass } from 'lucide-react';
import { Finding, Severity, ComplianceDetail } from '../types';

interface FindingsListProps {
  findings: Finding[];
}

const severityTooltips: Record<Severity, string> = {
  [Severity.CRITICAL]: "Critical Risk: Immediate security breach (e.g., public access), data loss risk, or compliance failure. Requires urgent remediation.",
  [Severity.HIGH]: "High Risk: Major deviation from architecture best practices, significant security gaps, or use of end-of-life resources.",
  [Severity.MEDIUM]: "Medium Risk: Operational friction, cost inefficiencies (FinOps), or potential performance bottlenecks.",
  [Severity.LOW]: "Low Risk: Minor configuration issues, naming convention violations, or housekeeping items.",
  [Severity.INFO]: "Informational: Neutral observation or context about the infrastructure."
};

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    [Severity.CRITICAL]: 'bg-red-500/10 text-red-500 border-red-500/20',
    [Severity.HIGH]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    [Severity.MEDIUM]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    [Severity.LOW]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    [Severity.INFO]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[severity]}`}>
      {severity}
    </span>
  );
};

const FindingItem: React.FC<{ finding: Finding, onShowCompliance: (comp: ComplianceDetail) => void }> = ({ finding, onShowCompliance }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finding.fix) {
      navigator.clipboard.writeText(finding.fix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dynamic category styling
  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('security')) return 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10';
    if (cat.includes('cost')) return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10';
    if (cat.includes('reliabil')) return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10';
    return 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20';
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-800 border-l-4 ${finding.severity === Severity.CRITICAL ? 'border-l-red-500' : finding.severity === Severity.HIGH ? 'border-l-orange-500' : 'border-l-indigo-500'} rounded-xl mb-4 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-lg group overflow-hidden shadow-sm`}>
      <div onClick={() => setIsOpen(!isOpen)} className="p-5 flex items-start gap-4 cursor-pointer select-none">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-slate-900 dark:text-white font-bold text-sm md:text-base tracking-tight leading-snug">{finding.title}</h4>
            <div className="flex items-center gap-3">
              <SeverityBadge severity={finding.severity} />
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {finding.fileName && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <FileCode className="w-3 h-3 text-slate-400" /> {finding.fileName}
              </span>
            )}
            {finding.lineNumber && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Hash className="w-3 h-3 text-slate-400" /> Ln {finding.lineNumber}
              </span>
            )}
            {finding.costSavings && (
              <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                <Banknote className="w-3 h-3" /> {finding.costSavings}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm ${getCategoryStyles(finding.category)}`}>
              <Bookmark className="w-3 h-3 opacity-60" />
              {finding.category}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {finding.compliance?.map((comp, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); onShowCompliance(comp); }} 
                  className="text-[9px] font-mono bg-white dark:bg-slate-950 text-indigo-500 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all flex items-center gap-1.5 group/comp shadow-sm whitespace-nowrap"
                >
                  <Compass className="w-3 h-3 opacity-50 group-hover/comp:rotate-90 transition-transform duration-500 shrink-0" />
                  <span className="font-bold opacity-60 mr-0.5">{comp.standard}</span>
                  <span className="font-black">{comp.controlId}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-6 pt-2 ml-4 md:ml-9 space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{finding.description}</p>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-800 relative">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2 tracking-widest">
                  <Target className="w-4 h-4" /> Recommended Action
                </h5>
                <div className="flex items-center gap-2">
                  {finding.fix && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowFix(!showFix); }} 
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-500 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                    >
                      {showFix ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showFix ? 'Hide Fix' : 'Show Code Fix'}
                    </button>
                  )}
                  {finding.fix && showFix && (
                    <button onClick={handleCopyFix} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1.5 transition-colors p-1">
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed mb-4">
                {finding.remediation}
              </p>
              {finding.fix && showFix && (
                <div className="relative group/code mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded uppercase">HCL / Terraform</span>
                  </div>
                  <pre className="p-4 bg-slate-900 rounded-lg text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                    {finding.fix}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [filter, setFilter] = useState<'ALL' | Severity>('ALL');
  const [activeCompliance, setActiveCompliance] = useState<ComplianceDetail | null>(null);

  const filteredFindings = useMemo(() => 
    findings.filter(f => filter === 'ALL' || f.severity === filter)
  , [findings, filter]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Key Audit Findings</h3>
        <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {['ALL', Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW].map(f => (
                <div key={f} className="relative group/filter-tooltip">
                    <button 
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                            ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
                        `}
                    >
                        {f}
                    </button>
                    {f !== 'ALL' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-2.5 bg-slate-800 text-white text-[10px] font-bold rounded-xl shadow-2xl opacity-0 invisible group-hover/filter-tooltip:opacity-100 group-hover/filter-tooltip:visible transition-all duration-200 z-[100] text-center leading-relaxed border border-slate-700 pointer-events-none uppercase tracking-wide">
                            {severityTooltips[f as Severity]}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="space-y-1">
        {filteredFindings.length > 0 ? (
            filteredFindings.map(f => <FindingItem key={f.id} finding={f} onShowCompliance={setActiveCompliance} />)
        ) : (
            <div className="py-24 text-center bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No matching findings identified.</p>
            </div>
        )}
      </div>

      {/* COMPLIANCE EXPLANATION MODAL (PROFESSIONAL INFO) */}
      {activeCompliance && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setActiveCompliance(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{activeCompliance.standard}</h3>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 block">Regulatory Framework Advisory</span>
                </div>
              </div>
              <button onClick={() => setActiveCompliance(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Control Identification */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                  <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Control Reference</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-300 font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                      {activeCompliance.controlId}
                  </span>
              </div>

              {/* Requirement Text */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Requirement Definition
                </div>
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed font-medium">
                  {activeCompliance.description}
                </p>
              </div>

              {/* Business/Security Impact */}
              <div className="space-y-3 p-5 bg-red-50/30 dark:bg-red-950/10 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                    <Activity className="w-3.5 h-3.5" />
                    Risk & Impact
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                  {activeCompliance.impact}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button 
                onClick={() => setActiveCompliance(null)} 
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-xs uppercase tracking-widest active:scale-95"
              >
                Acknowledge Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};