import React, { useState, useMemo } from 'react';
import { Finding, ComplianceDetail, Severity } from '../types';
import { 
  ShieldCheck, AlertOctagon, AlertTriangle, BookOpen, Compass, 
  CheckCircle2, Filter, Search, Landmark, ExternalLink
} from 'lucide-react';

interface ComplianceMatrixProps {
  findings: Finding[];
}

interface ComplianceRecord extends ComplianceDetail {
  severity: Severity;
  findingTitle: string;
  fileName?: string;
  lineNumber?: number;
}

export const ComplianceMatrix: React.FC<ComplianceMatrixProps> = ({ findings }) => {
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract and normalize all compliance items from findings
  const allRecords = useMemo(() => {
    const records: ComplianceRecord[] = [];
    findings.forEach(f => {
      if (f.compliance && f.compliance.length > 0) {
        f.compliance.forEach(c => {
          records.push({
            ...c,
            severity: f.severity,
            findingTitle: f.title,
            fileName: f.fileName,
            lineNumber: f.lineNumber
          });
        });
      }
    });
    return records;
  }, [findings]);

  // Unique standards available
  const availableStandards = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach(r => {
      if (r.standard) set.add(r.standard);
    });
    return Array.from(set);
  }, [allRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchesStandard = selectedStandard === 'ALL' || r.standard === selectedStandard;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        r.controlId.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) || 
        r.standard.toLowerCase().includes(q) ||
        r.findingTitle.toLowerCase().includes(q);
      return matchesStandard && matchesSearch;
    });
  }, [allRecords, selectedStandard, searchQuery]);

  // Group stats by standard
  const standardStats = useMemo(() => {
    const stats: Record<string, { total: number; critical: number; high: number }> = {};
    allRecords.forEach(r => {
      if (!stats[r.standard]) stats[r.standard] = { total: 0, critical: 0, high: 0 };
      stats[r.standard].total++;
      if (r.severity === Severity.CRITICAL) stats[r.standard].critical++;
      if (r.severity === Severity.HIGH) stats[r.standard].high++;
    });
    return stats;
  }, [allRecords]);

  if (allRecords.length === 0) return null;

  return (
    <div className="w-full mb-8 animate-enter bg-white dark:bg-[#0a0f1e] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-2xl">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Regulatory Compliance Matrix
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mapping of infrastructure violations against international cybersecurity frameworks.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search control ID or regulation..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Standards Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 my-8">
        {availableStandards.map(std => {
          const s = standardStats[std] || { total: 0, critical: 0, high: 0 };
          const isSelected = selectedStandard === std;
          return (
            <button
              key={std}
              onClick={() => setSelectedStandard(isSelected ? 'ALL' : std)}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Framework
                </span>
                {s.critical > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white">
                    {s.critical} Critical
                  </span>
                )}
              </div>
              <h4 className={`font-black text-sm md:text-base leading-snug truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {std}
              </h4>
              <p className={`text-xs mt-2 font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                {s.total} non-compliant control{s.total > 1 ? 's' : ''}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setSelectedStandard('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            selectedStandard === 'ALL'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
          }`}
        >
          All Frameworks ({allRecords.length})
        </button>
        {availableStandards.map(std => (
          <button
            key={std}
            onClick={() => setSelectedStandard(std)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              selectedStandard === std
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            {std}
          </button>
        ))}
      </div>

      {/* Compliance Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#111827]/60 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <th className="py-4 px-6">Severity</th>
              <th className="py-4 px-6">Standard & Control ID</th>
              <th className="py-4 px-6">Requirement Description</th>
              <th className="py-4 px-6">Business & Security Impact</th>
              <th className="py-4 px-6">Mapped Resource</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  
                  {/* Severity */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      r.severity === Severity.CRITICAL
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : r.severity === Severity.HIGH
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {r.severity}
                    </span>
                  </td>

                  {/* Standard & Control */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white block">{r.standard}</span>
                    <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                      {r.controlId}
                    </span>
                  </td>

                  {/* Requirement Description */}
                  <td className="py-4 px-6 min-w-[280px] max-w-md">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {r.description}
                    </p>
                  </td>

                  {/* Impact */}
                  <td className="py-4 px-6 min-w-[240px] max-w-sm">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      {r.impact || 'Violation increases exposure to unauthorized access or audit compliance sanctions.'}
                    </p>
                  </td>

                  {/* Mapped Resource */}
                  <td className="py-4 px-6 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    <span className="block font-bold">{r.findingTitle}</span>
                    <span className="text-slate-400 text-[10px]">
                      {r.fileName || 'main.tf'}{r.lineNumber ? `:${r.lineNumber}` : ''}
                    </span>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                  No matching compliance controls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
