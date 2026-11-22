import React from 'react';
import { X, Clock, Trash2, ChevronRight, FileText, Calendar, GitCompare } from 'lucide-react';
import { HistoryItem, Severity } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  comparedId?: string | null;
  onCompare?: (item: HistoryItem | null) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  comparedId,
  onCompare
}) => {
  const getStatus = (findings: any[]) => {
    const critical = findings.filter((f) => f.severity === Severity.CRITICAL).length;
    const high = findings.filter((f) => f.severity === Severity.HIGH).length;
    if (critical > 0)
      return {
        label: 'Do Not Deploy',
        color: 'text-red-600 dark:text-red-400',
        border: 'bg-red-500'
      };
    if (high > 0)
      return {
        label: 'Needs Review',
        color: 'text-amber-600 dark:text-amber-400',
        border: 'bg-amber-500'
      };
    return {
      label: 'Deployable',
      color: 'text-emerald-600 dark:text-emerald-400',
      border: 'bg-emerald-500'
    };
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        aria-label="Audit history sidebar"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="font-bold text-lg">Audit History &amp; Drift</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit history"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full">
                <FileText className="w-8 h-8 opacity-50" aria-hidden="true" />
              </div>
              <p className="text-sm">
                No audits run yet.
                <br />
                Start an assessment to track drift &amp; deltas.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const status = getStatus(item.result.findings);
              const isCompared = comparedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`group relative bg-white dark:bg-slate-800/50 border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                    isCompared
                      ? 'border-indigo-500 ring-1 ring-indigo-500/40'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${status.border}`} />

                  <div className="flex justify-between items-start mb-2 pl-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-0.5">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {onCompare && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompare(isCompared ? null : item);
                          }}
                          title="Compare current audit against this baseline"
                          className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border transition-all flex items-center gap-1 ${
                            isCompared
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-500'
                          }`}
                        >
                          <GitCompare className="w-3 h-3" aria-hidden="true" />
                          {isCompared ? 'Baseline' : 'Compare'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => onDelete(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete scan from history"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="pl-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className={`text-base font-bold ${status.color}`}>{status.label}</div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {item.result.findings.length} Issues Found
                      </span>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <p className="text-xs text-slate-400">
              Click <strong>Compare</strong> on any past scan to view score &amp; blocker deltas.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
