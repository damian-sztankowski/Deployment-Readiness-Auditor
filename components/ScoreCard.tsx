import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Finding, Severity } from '../types';
import { AlertTriangle, ShieldAlert, CheckCircle, AlertOctagon } from 'lucide-react';

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

       <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center h-full">
          
          {/* LEFT: Chart Section */}
          <div className="relative w-48 h-48 flex-shrink-0">
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
                {/* Tooltip removed to prevent gray box overlay */}
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

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                      <span className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">{counts.critical}</span>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                      <span className="text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">{counts.high}</span>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">High</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                      <span className="text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.medium}</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Medium</span>
                  </div>
              </div>

              {/* Summary Text */}
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="font-semibold text-slate-900 dark:text-white mr-1">Analysis:</span>
                  {summary}
              </div>
          </div>
       </div>
    </div>
  );
};