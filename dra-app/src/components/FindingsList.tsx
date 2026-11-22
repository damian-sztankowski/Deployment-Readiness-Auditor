import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  Target,
  ShieldCheck,
  Copy,
  Check,
  FileCode,
  Hash,
  Banknote,
  Eye,
  EyeOff,
  Landmark,
  Activity,
  BookOpen,
  Bookmark,
  Compass,
  Bot,
  Cpu,
  Search
} from 'lucide-react';
import { Finding, Severity, ComplianceDetail } from '../types';
import { ModalDialog } from './ModalDialog';

interface FindingsListProps {
  findings: Finding[];
  onJumpToLine?: (fileName: string | undefined, line: number) => void;
  onAskArchitect?: (finding: Finding) => void;
}

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    [Severity.CRITICAL]: 'bg-red-500/10 text-red-500 border-red-500/20',
    [Severity.HIGH]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    [Severity.MEDIUM]: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    [Severity.LOW]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    [Severity.INFO]: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[severity]}`}
    >
      {severity}
    </span>
  );
};

const SourceBadge = ({ source }: { source?: Finding['source'] }) => {
  if (!source) return null;
  const map = {
    deterministic: {
      label: 'AST Verified',
      cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    },
    hybrid: {
      label: 'Hybrid AST+AI',
      cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
    },
    policy: {
      label: 'Org Policy',
      cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    },
    ai: {
      label: 'AI Attack-Path',
      cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
    }
  };
  const info = map[source];
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${info.cls}`}>
      <Cpu className="w-2.5 h-2.5" aria-hidden="true" />
      {info.label}
    </span>
  );
};

const FindingItem: React.FC<{
  finding: Finding;
  onShowCompliance: (comp: ComplianceDetail) => void;
  onJumpToLine?: (fileName: string | undefined, line: number) => void;
  onAskArchitect?: (finding: Finding) => void;
}> = ({ finding, onShowCompliance, onJumpToLine, onAskArchitect }) => {
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

  const getCategoryStyles = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('security'))
      return 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10';
    if (cat.includes('cost'))
      return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10';
    if (cat.includes('reliabil'))
      return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10';
    return 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20';
  };

  return (
    <div
      className={`border border-slate-200 dark:border-slate-800 border-l-4 ${
        finding.severity === Severity.CRITICAL
          ? 'border-l-red-500'
          : finding.severity === Severity.HIGH
            ? 'border-l-orange-500'
            : 'border-l-indigo-500'
      } rounded-xl mb-4 bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-lg group overflow-hidden shadow-sm`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-start gap-4 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-3 mb-2">
            <h4 className="text-slate-900 dark:text-white font-bold text-sm md:text-base tracking-tight leading-snug">
              {finding.title}
            </h4>
            <div className="flex items-center gap-2.5 shrink-0">
              <SourceBadge source={finding.source} />
              <SeverityBadge severity={finding.severity} />
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(finding.fileName || finding.lineNumber) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onJumpToLine && finding.lineNumber) {
                    onJumpToLine(finding.fileName, finding.lineNumber);
                  }
                }}
                title="Jump to this line in the IaC code editor"
                className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <FileCode className="w-3 h-3 text-slate-400" aria-hidden="true" />
                <span>{finding.fileName || 'main.tf'}</span>
                {finding.lineNumber && (
                  <>
                    <Hash className="w-2.5 h-2.5 text-slate-400 ml-1" aria-hidden="true" />
                    <span>
                      Ln {finding.lineNumber}
                      {finding.endLineNumber && finding.endLineNumber > finding.lineNumber
                        ? `-${finding.endLineNumber}`
                        : ''}
                    </span>
                  </>
                )}
              </button>
            )}
            {finding.costSavings && (
              <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                <Banknote className="w-3 h-3" aria-hidden="true" /> {finding.costSavings}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shadow-sm ${getCategoryStyles(
                  finding.category
                )}`}
              >
                <Bookmark className="w-3 h-3 opacity-60" aria-hidden="true" />
                {finding.category}
              </div>

              {finding.compliance?.map((comp, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowCompliance(comp);
                  }}
                  className="text-[9px] font-mono bg-white dark:bg-slate-950 text-indigo-500 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <Compass className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />
                  <span className="font-bold opacity-60">{comp.standard}</span>
                  <span className="font-black">{comp.controlId}</span>
                </button>
              ))}
            </div>

            {onAskArchitect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAskArchitect(finding);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] font-black uppercase tracking-wider transition-all"
              >
                <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                Ask Architect
              </button>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-6 pt-2 ml-4 md:ml-8 space-y-5 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
            {finding.description}
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h5 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2 tracking-widest">
                <Target className="w-4 h-4" aria-hidden="true" /> Recommended Action
              </h5>
              <div className="flex items-center gap-2">
                {finding.fix && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFix(!showFix);
                    }}
                    className="text-[10px] font-bold text-slate-500 hover:text-indigo-500 flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
                  >
                    {showFix ? (
                      <EyeOff className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <Eye className="w-3 h-3" aria-hidden="true" />
                    )}
                    {showFix ? 'Hide Fix' : 'Show Code Fix'}
                  </button>
                )}
                {finding.fix && showFix && (
                  <button
                    type="button"
                    onClick={handleCopyFix}
                    aria-label="Copy remediation code snippet"
                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1.5 transition-colors p-1"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm leading-relaxed">
              {finding.remediation}
            </p>
            {finding.fix && showFix && (
              <div className="relative mt-4">
                <pre
                  role="region"
                  aria-label={`Suggested code fix for ${finding.title}`}
                  tabIndex={0}
                  className="p-4 bg-slate-900 rounded-lg text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 shadow-inner"
                >
                  <code>{finding.fix}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onJumpToLine,
  onAskArchitect
}) => {
  const [filter, setFilter] = useState<'ALL' | Severity>('ALL');
  const [query, setQuery] = useState('');
  const [activeCompliance, setActiveCompliance] = useState<ComplianceDetail | null>(null);

  const filteredFindings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings.filter((f) => {
      const matchesSev = filter === 'ALL' || f.severity === filter;
      const matchesQuery =
        !q ||
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.fileName || '').toLowerCase().includes(q) ||
        (f.resourceAddress || '').toLowerCase().includes(q);
      return matchesSev && matchesQuery;
    });
  }, [findings, filter, query]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
          Key Audit Findings ({filteredFindings.length})
        </h3>

        <search className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter findings by resource or keyword"
              placeholder="Search resource or risk..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            {['ALL', Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW].map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </search>
      </div>

      <div className="space-y-1">
        {filteredFindings.length > 0 ? (
          filteredFindings.map((f) => (
            <FindingItem
              key={f.id}
              finding={f}
              onShowCompliance={setActiveCompliance}
              onJumpToLine={onJumpToLine}
              onAskArchitect={onAskArchitect}
            />
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" aria-hidden="true" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
              No matching findings identified.
            </p>
          </div>
        )}
      </div>

      <ModalDialog
        isOpen={Boolean(activeCompliance)}
        onClose={() => setActiveCompliance(null)}
        title={activeCompliance?.standard || 'Regulatory Framework'}
        subtitle="Regulatory Framework Control Advisory"
        icon={<Landmark className="w-6 h-6" />}
        maxWidthClass="max-w-xl"
        footer={
          <div className="flex justify-end">
            <form method="dialog">
              <button
                type="submit"
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-xs uppercase tracking-widest"
              >
                Acknowledge Control
              </button>
            </form>
          </div>
        }
      >
        {activeCompliance && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Control Reference
                </span>
              </div>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-300 font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                {activeCompliance.controlId}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                Requirement Definition
              </div>
              <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed font-medium">
                {activeCompliance.description}
              </p>
            </div>

            <div className="space-y-2 p-5 bg-red-50/30 dark:bg-red-950/10 rounded-2xl border border-red-100/50 dark:border-red-900/20">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                Risk &amp; Audit Impact
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic">
                {activeCompliance.impact}
              </p>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};
