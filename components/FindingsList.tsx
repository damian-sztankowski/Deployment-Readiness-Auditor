import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ChevronDown, Target, Filter, ShieldCheck, Wand2, Copy, Check, FileCode, Hash, Banknote, Shield, ExternalLink, X, BookOpen, Globe, Layout } from 'lucide-react';
import { Finding, Severity } from '../types';

interface FindingsListProps {
  findings: Finding[];
}

interface StandardDetail {
  name: string;
  description: string;
}

// Knowledge base for common compliance standards
const COMPLIANCE_REGISTRY: Record<string, StandardDetail> = {
  'CIS': {
    name: 'CIS Google Cloud Platform Foundation Benchmark',
    description: 'A set of best-practice cybersecurity standards for Google Cloud Platform, developed by the Center for Internet Security (CIS). These controls provide prescriptive guidance for establishing a secure baseline configuration for GCP services including IAM, Logging, Networking, and Virtual Machines.'
  },
  'NIST': {
    name: 'NIST Special Publication 800-53',
    description: 'A regulatory standard that provides a catalog of security and privacy controls for federal information systems and organizations to protect organizational operations and assets. It covers a broad range of areas including access control, incident response, and system integrity.'
  },
  'HIPAA': {
    name: 'Health Insurance Portability and Accountability Act',
    description: 'Standard for protecting sensitive patient data. Any company that deals with protected health information (PHI) must ensure that all the required physical, network, and process security measures are in place to ensure confidentiality and integrity of health records.'
  },
  'SOC2': {
    name: 'Service Organization Control 2',
    description: 'A voluntary compliance standard for service organizations, developed by the AICPA, which specifies how organizations should manage customer data based on five "trust service principles": security, availability, processing integrity, confidentiality, and privacy.'
  },
  'PCI': {
    name: 'PCI Data Security Standard (PCI DSS)',
    description: 'The Payment Card Industry Data Security Standard is an information security standard for organizations that handle branded credit cards from the major card schemes. It focuses on secure network architecture and data protection.'
  },
  'ISO': {
    name: 'ISO/IEC 27001',
    description: 'An international standard on how to manage information security. It details requirements for establishing, implementing, maintaining and continually improving an information security management system (ISMS).'
  }
};

const getStandardDetails = (id: string): StandardDetail => {
  const upperId = id.toUpperCase();
  // Match prefix
  const key = Object.keys(COMPLIANCE_REGISTRY).find(k => upperId.startsWith(k));
  if (key) return COMPLIANCE_REGISTRY[key];
  
  // Fallback for unknown standards
  return {
    name: id,
    description: `Specific security control and compliance requirement belonging to the ${id} framework. This control ensures adherence to best-practices within this regulatory domain for cloud infrastructure.`
  };
};

const severityTooltips: Record<Severity, string> = {
  [Severity.CRITICAL]: "Critical Risk: Immediate security breach (e.g., public access), data loss risk, or compliance failure. Requires urgent remediation.",
  [Severity.HIGH]: "High Risk: Major deviation from architecture best practices, significant security gaps, or use of end-of-life resources.",
  [Severity.MEDIUM]: "Medium Risk: Operational friction, cost inefficiencies (FinOps), or potential performance bottlenecks.",
  [Severity.LOW]: "Low Risk: Minor configuration issues, naming convention violations, or housekeeping items.",
  [Severity.INFO]: "Informational: Neutral observation or context about the infrastructure."
};

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

  const tooltipText = severityTooltips[severity];

  return (
    <div className="relative group/tooltip inline-flex">
        <span className={`cursor-help px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[severity]}`}>
          {severity}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none text-center leading-relaxed border border-slate-700">
            {tooltipText}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
  );
};

const ComplianceModal = ({ standardId, finding, onClose }: { standardId: string | null, finding: Finding | null, onClose: () => void }) => {
  if (!standardId || !finding) return null;
  const details = getStandardDetails(standardId);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-enter overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{standardId}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance Standard</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto pb-8">
           {/* Section: Pillar Information */}
           <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <Layout className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Related Architecture Pillar</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{finding.category}</p>
              </div>
           </div>

           <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Standard Overview
              </h4>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                {details.name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {details.description}
              </p>
           </div>

           {/* Relevance Section */}
           <div className="space-y-3 bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" />
                Relevance to Finding
              </h4>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Adherence to <span className="font-bold text-indigo-700 dark:text-indigo-300">{standardId}</span> directly addresses the risk identified in <span className="italic">"{finding.title}"</span>. 
                By following this control, you ensure your infrastructure meets regulatory expectations for <span className="font-medium">{finding.category.toLowerCase()}</span> integrity.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const FindingItem: React.FC<{ finding: Finding, onShowCompliance: (id: string, finding: Finding) => void }> = ({ finding, onShowCompliance }) => {
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
             <div className="flex flex-col gap-1.5 min-w-0">
                <h4 className="text-slate-900 dark:text-white font-semibold text-sm md:text-base leading-tight break-words">{finding.title}</h4>
                
                <div className="flex flex-wrap items-center gap-2">
                    {(finding.fileName || finding.lineNumber) && (
                        <>
                            {finding.fileName && (
                                <span className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 max-w-full truncate" title={`File: ${finding.fileName}`}>
                                    <FileCode className="w-3 h-3 text-slate-400" />
                                    {finding.fileName}
                                </span>
                            )}
                            {finding.lineNumber && (
                                <span className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    <Hash className="w-3 h-3 text-slate-400" />
                                    Ln {finding.lineNumber}
                                </span>
                            )}
                        </>
                    )}
                    {finding.costSavings && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 animate-pulse">
                            <Banknote className="w-3 h-3" />
                            {finding.costSavings}
                        </span>
                    )}
                </div>
             </div>
             
             <div className="flex items-center gap-3 flex-shrink-0">
                <SeverityBadge severity={finding.severity} />
                <div className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-slate-400"/>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                {finding.category}
            </span>
            
            {finding.compliance && finding.compliance.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1">
                    {finding.compliance.slice(0, 2).map((std, idx) => (
                        <button 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); onShowCompliance(std, finding); }}
                            className="inline-flex items-center gap-1 bg-indigo-50/50 dark:bg-indigo-900/20 text-[9px] text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono border border-indigo-100/50 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        >
                            <Shield className="w-2.5 h-2.5" />
                            {std}
                        </button>
                    ))}
                    {finding.compliance.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-medium">+{finding.compliance.length - 2} more</span>
                    )}
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

                {finding.compliance && finding.compliance.length > 0 && (
                    <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            Compliance Alignment
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {finding.compliance.map((std, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => onShowCompliance(std, finding)}
                                    className="group/std flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600 active:scale-95"
                                >
                                    <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[8px] font-black">
                                        ✓
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 group-hover/std:text-indigo-600 dark:group-hover/std:text-indigo-400 transition-colors">
                                        {std}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 italic">
                            * Click standard badges for control definitions.
                        </p>
                    </div>
                )}

                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/20"></div>
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                            <Target className="w-3 h-3" />
                            Recommended Action
                        </h5>
                        
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
  const [activeStandard, setActiveStandard] = useState<{ id: string, finding: Finding } | null>(null);

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

  const handleShowCompliance = (id: string, finding: Finding) => {
    setActiveStandard({ id, finding });
  };

  return (
    <div className="h-full flex flex-col">
      <ComplianceModal 
        standardId={activeStandard?.id || null} 
        finding={activeStandard?.finding || null}
        onClose={() => setActiveStandard(null)} 
      />
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Key Findings
        </h3>
      </div>

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
            <FindingItem key={finding.id} finding={finding} onShowCompliance={handleShowCompliance} />
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