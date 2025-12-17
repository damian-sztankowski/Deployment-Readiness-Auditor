import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Finding, Severity } from '../types';
import { AlertTriangle, ShieldAlert, CheckCircle, AlertOctagon, Info, HelpCircle } from 'lucide-react';

interface ScoreCardProps {
  findings: Finding[];
  summary: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ findings, summary }) => {
  
  // Calculate counts deterministically
  const counts = useMemo(() => {
    return {
      critical: findings.filter(f => f.severity === Severity.CRITICAL).length,
      high: findings.filter(f => f.severity === Severity.HIGH).length,
      medium: findings.filter(f => f.severity === Severity.MEDIUM).length,
      low: findings.filter(f => f.severity === Severity.LOW || f.severity === Severity.INFO).length,
      total: findings.length
    };
  }, [findings]);

  // Determine Status based on counts
  let status = "DEPLOYABLE";
  let statusColor = "emerald"; // green
  let StatusIcon = CheckCircle;
  let glowColor = "rgba(16, 185, 129, 0.5)"; // emerald-500
  
  if (counts.critical > 0) {
    status = "DO NOT DEPLOY";
    statusColor = "red";
    StatusIcon = AlertOctagon;
    glowColor = "rgba(239, 68, 68, 0.6)"; // red-500
  } else if (counts.high > 0) {
    status = "NEEDS REVIEW";
    statusColor = "amber"; // orange
    StatusIcon = AlertTriangle;
    glowColor = "rgba(245, 158, 11, 0.6)"; // amber-500
  }

  // Chart Data
  const data = [
    { name: 'Critical', value: counts.critical, color: '#ef4444' }, // Red 500
    { name: 'High', value: counts.high, color: '#f97316' },     // Orange 500
    { name: 'Medium', value: counts.medium, color: '#eab308' },   // Yellow 500
    { name: 'Low', value: counts.low, color: '#3b82f6' },      // Blue 500
  ].filter(d => d.value > 0);

  // Fallback for 0 findings
  if (data.length === 0) {
    data.push({ name: 'Safe', value: 1, color: '#10b981' });
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full overflow-hidden relative group">
       {/* Decorative Top Border based on status */}
       <div className={`absolute top-0 left-0 w-full h-1 bg-${statusColor}-500 z-20`}></div>

       <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center flex-1">
          
          {/* LEFT: Chart Section */}
          <div id="score-pie-chart" className="relative w-48 h-48 flex-shrink-0">
            {/* Animated Glow Behind Chart */}
            <div 
                className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse"
                style={{ backgroundColor: glowColor }}
            ></div>

            {/* The Chart */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                  isAnimationActive={true}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className={`text-4xl font-black text-slate-800 dark:text-white drop-shadow-md`}>
                {counts.total}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                Risks
              </span>
            </div>
          </div>

          {/* RIGHT: Info Section */}
          <div className="flex-1 w-full space-y-6">
              
              {/* Header & Status */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Readiness Assessment
                      </h3>
                      {/* Animated Status Text */}
                      <div className={`flex items-center gap-2 text-2xl font-bold text-${statusColor}-600 dark:text-${statusColor}-400 animate-pulse`}>
                          <StatusIcon className="w-6 h-6 fill-current opacity-80" />
                          <span className="tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{status}</span>
                      </div>
                  </div>
              </div>

              {/* Stats Grid - Updated to 4 columns */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">{counts.critical}</span>
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Crit</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{counts.high}</span>
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">High</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.medium}</span>
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Med</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{counts.low}</span>
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Low</span>
                  </div>
              </div>

              {/* Summary Text */}
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="font-semibold text-slate-900 dark:text-white mr-1">Analysis:</span>
                  {summary}
              </div>
          </div>
       </div>

       {/* AUDIT AGENDA / MAP FOOTER */}
       <div className="bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3 px-2">
             <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
             <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Readiness Criteria Map</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="flex items-start gap-2.5 px-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">DO NOT DEPLOY</span>
                   <span className="text-[10px] text-slate-500 dark:text-slate-400">Contains 1+ Critical risks.</span>
                </div>
             </div>
             <div className="flex items-start gap-2.5 px-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">NEEDS REVIEW</span>
                   <span className="text-[10px] text-slate-500 dark:text-slate-400">Contains 1+ High risks.</span>
                </div>
             </div>
             <div className="flex items-start gap-2.5 px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex flex-col">
                   <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">DEPLOYABLE</span>
                   <span className="text-[10px] text-slate-500 dark:text-slate-400">Only Med/Low risks.</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};