import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ChevronDown, Target, Filter, ShieldCheck, Wand2, Copy, Check } from 'lucide-react';
import { Finding, Severity } from '../types';

interface FindingsListProps {
  findings: Finding[];
}

const SeverityIcon = ({ severity }: { severity: Severity }) => {
  switch (severity) {
    case Severity.CRITICAL:
      return <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case Severity.HIGH:
      return <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
    case Severity.MEDIUM:
      return <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    case Severity.LOW:
      return <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    default:
      return <CheckCircle className="w-5 h-5 text-slate-400" />;
  }
};

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    [Severity.CRITICAL]: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    [Severity.HIGH]: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    [Severity.MEDIUM]: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    [Severity.LOW]: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    [Severity.INFO]: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[severity]}`}>
      {severity}
    </span>
  );
};

const FindingItem: React.FC<{ finding: Finding }> = ({ finding }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const borderColors = {
    [Severity.CRITICAL]: 'border-l-red-500',
    [Severity.HIGH]: 'border-l-orange-500',
    [Severity.MEDIUM]: 'border-l-amber-500',
    [Severity.LOW]: 'border-l-blue-500',
    [Severity.INFO]: 'border-l-slate-300 dark:border-l-slate-600',
  };

  const handleCopyFix = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finding.fix) {
        navigator.clipboard.writeText(finding.fix);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-700 border-l-4 ${borderColors[finding.severity]} rounded-r-xl rounded-l-sm mb-3 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-md group`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-start gap-4 cursor-pointer select-none"
      >
        <div className="mt-0.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          <SeverityIcon severity={finding.severity} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4 mb-1">
             <h4 className="text-slate-900 dark:text-white font-semibold text-sm md:text-base leading-tight">{finding.title}</h4>
             <div className="flex items-center gap-3 flex-shrink-0">
                <SeverityBadge severity={finding.severity} />
                <div className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-slate-400"/>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 font-medium">
                {finding.category}
            </span>
            
            {/* Compliance Badges */}
            {finding.compliance && finding.compliance.length > 0 && (
                <div className="flex flex-wrap gap-2 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1">
                    {finding.compliance.map((std, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-[10px] text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 font-mono">
                            <ShieldCheck className="w-3 h-3" />
                            {std}
                        </span>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
            <div className="px-5 pb-5 pt-0 pl-[3.5rem]">
                <div className="text-base text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {finding.description}
                </div>
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20"></div>
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                            <Target className="w-3 h-3" />
                            Recommended Action
                        </h5>
                        
                        {/* Fix It Button */}
                        {finding.fix && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowFix(!showFix); }}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                                    ${showFix 
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700' 
                                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-sm'}
                                `}
                            >
                                <Wand2 className="w-3 h-3" />
                                {showFix ? 'Hide Fix' : 'Show Code Fix'}
                            </button>
                        )}
                    </div>
                    
                    <p className="text-sm md:text-base text-slate-800 dark:text-slate-200 font-mono break-all whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                        {finding.remediation}
                    </p>

                    {/* Code Fix Block */}
                    {finding.fix && (
                        <div className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${showFix ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="relative group/code">
                                <div className="absolute -top-3 left-4 bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-t-md font-mono border-t border-l border-r border-slate-700">
                                    Suggested Fix
                                </div>
                                <div className="bg-slate-900 rounded-lg border border-slate-700 shadow-inner p-4 pt-5 overflow-x-auto relative">
                                    <button 
                                        onClick={handleCopyFix}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-md transition-colors"
                                        title="Copy code"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <pre className="text-xs md:text-sm font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
                                        {finding.fix}
                                    </pre>
                                </div>
                            </div>
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

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: findings.length };
    Object.values(Severity).forEach(s => c[s] = 0);
    findings.forEach(f => {
        c[f.severity] = (c[f.severity] || 0) + 1;
    });
    return c;
  }, [findings]);

  if (findings.length === 0) {
    return (
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">Well Architected!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">No critical issues detected against the framework.</p>
        </div>
    )
  }

  // Sort by severity priority
  const severityOrder = {
    [Severity.CRITICAL]: 0,
    [Severity.HIGH]: 1,
    [Severity.MEDIUM]: 2,
    [Severity.LOW]: 3,
    [Severity.INFO]: 4,
  };

  const filteredFindings = findings
    .filter(f => filter === 'ALL' || f.severity === filter)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const tabs = [
      { id: 'ALL', label: 'All Issues', count: counts.ALL, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
      { id: Severity.CRITICAL, label: 'Critical', count: counts[Severity.CRITICAL], color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
      { id: Severity.HIGH, label: 'High', count: counts[Severity.HIGH], color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
      { id: Severity.MEDIUM, label: 'Medium', count: counts[Severity.MEDIUM], color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
      { id: Severity.LOW, label: 'Low', count: counts[Severity.LOW], color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Key Findings
        </h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                disabled={tab.count === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200
                    ${filter === tab.id 
                        ? 'ring-2 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900 border-transparent shadow-sm scale-105' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    ${tab.count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${filter === tab.id ? tab.color.replace('50', '100') : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'}
                `}
            >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-white/50 dark:bg-black/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {tab.count}
                </span>
            </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredFindings.length > 0 ? (
            filteredFindings.map((finding) => (
            <FindingItem key={finding.id} finding={finding} />
            ))
        ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="text-slate-400 text-sm">No findings match this filter.</p>
            </div>
        )}
      </div>
    </div>
  );
};