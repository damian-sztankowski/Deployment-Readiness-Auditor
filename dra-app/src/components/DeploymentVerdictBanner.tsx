import React, { useMemo } from 'react';
import { Finding, CategoryScore, Severity } from '../types';
import { 
  ShieldAlert, ShieldCheck, AlertOctagon, Flame, CheckCircle2, 
  AlertTriangle, ArrowUpRight, Lock, DollarSign, Activity, Zap
} from 'lucide-react';

interface DeploymentVerdictBannerProps {
  findings: Finding[];
  categories: CategoryScore[];
}

export const DeploymentVerdictBanner: React.FC<DeploymentVerdictBannerProps> = ({
  findings,
  categories
}) => {
  const stats = useMemo(() => {
    let criticals = 0;
    let highs = 0;
    let mediums = 0;
    let lows = 0;

    findings.forEach(f => {
      switch (f.severity) {
        case Severity.CRITICAL: criticals++; break;
        case Severity.HIGH: highs++; break;
        case Severity.MEDIUM: mediums++; break;
        default: lows++; break;
      }
    });

    // Weighted average of categories
    const avgScore = categories.length > 0
      ? Math.round(categories.reduce((acc, c) => acc + c.score, 0) / categories.length)
      : 100;

    let grade = 'A+';
    if (criticals > 0 || avgScore < 50) grade = 'F';
    else if (avgScore < 65) grade = 'D';
    else if (avgScore < 75) grade = 'C';
    else if (avgScore < 85) grade = 'B';
    else if (avgScore < 95) grade = 'A';

    let verdict: 'BLOCKED' | 'CONDITIONAL' | 'READY' = 'READY';
    if (criticals > 0) {
      verdict = 'BLOCKED';
    } else if (highs > 0 || avgScore < 75) {
      verdict = 'CONDITIONAL';
    }

    let blastRadius = 'LOW';
    if (criticals > 0) blastRadius = 'CRITICAL';
    else if (highs > 0) blastRadius = 'MODERATE';

    // Calculate FinOps potential
    let monthlySavings = 0;
    findings.forEach(f => {
      if (f.costSavings) {
        const m = f.costSavings.match(/\$(\d+(\.\d+)?)/);
        if (m && m[1]) monthlySavings += parseFloat(m[1]);
      }
    });

    return {
      criticals,
      highs,
      mediums,
      lows,
      avgScore,
      grade,
      verdict,
      blastRadius,
      monthlySavings
    };
  }, [findings, categories]);

  const isBlocked = stats.verdict === 'BLOCKED';
  const isConditional = stats.verdict === 'CONDITIONAL';

  return (
    <div className="w-full mb-8 animate-enter">
      <div className={`relative overflow-hidden rounded-[2.5rem] border p-8 md:p-10 shadow-xl transition-all duration-500 backdrop-blur-xl ${
        isBlocked
          ? 'bg-gradient-to-br from-rose-50/90 via-white to-red-50/60 border-red-200 shadow-red-500/5 dark:from-red-950/30 dark:via-slate-900/90 dark:to-red-950/40 dark:border-red-900/50 dark:shadow-2xl'
          : isConditional
            ? 'bg-gradient-to-br from-amber-50/90 via-white to-amber-50/60 border-amber-200 shadow-amber-500/5 dark:from-amber-950/30 dark:via-slate-900/90 dark:to-amber-950/40 dark:border-amber-900/50 dark:shadow-2xl'
            : 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/60 border-emerald-200 shadow-emerald-500/5 dark:from-emerald-950/30 dark:via-slate-900/90 dark:to-emerald-950/40 dark:border-emerald-900/50 dark:shadow-2xl'
      }`}>
        
        {/* Glow ambient accent */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20 dark:opacity-25 ${
          isBlocked ? 'bg-red-400 dark:bg-red-500' : isConditional ? 'bg-amber-400 dark:bg-amber-500' : 'bg-emerald-400 dark:bg-emerald-500'
        }`} />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          
          {/* Left: Verdict Stamp & Title */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${
                isBlocked
                  ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40 animate-pulse'
                  : isConditional
                    ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
              }`}>
                {isBlocked ? <AlertOctagon className="w-4 h-4" /> : isConditional ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                Deployment Gate: {stats.verdict}
              </span>

              <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                <Flame className={`w-3.5 h-3.5 ${isBlocked ? 'text-red-600 dark:text-red-400' : isConditional ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-slate-400'}`} />
                Blast Radius: {stats.blastRadius}
              </span>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {isBlocked && "Production Deployment Blocked"}
                {isConditional && "Conditional Production Readiness"}
                {!isBlocked && !isConditional && "Production Readiness Cleared"}
              </h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                {isBlocked && `${stats.criticals} critical security ${stats.criticals === 1 ? 'vulnerability violates' : 'vulnerabilities violate'} release criteria. Direct deployment to production could lead to data breach or unauthorized ingress.`}
                {isConditional && `Infrastructure complies with basic baselines, but ${stats.highs} high-severity risk(s) must be reviewed by the security team prior to production roll-out.`}
                {!isBlocked && !isConditional && "All Well-Architected Framework gates passed without critical blockers. The deployment manifest is approved for release."}
              </p>
            </div>
          </div>

          {/* Right: Score Grade + KPI Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            
            {/* Grade Tile */}
            <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center min-w-[130px] shadow-sm ${
              isBlocked 
                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' 
                : isConditional 
                  ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' 
                  : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Maturity Grade</span>
              <span className="text-5xl font-black tracking-tighter my-1">{stats.grade}</span>
              <span className="text-xs font-mono font-bold opacity-90">{stats.avgScore}/100</span>
            </div>

            {/* Quick Metrics Column */}
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              
              <div className="p-4 bg-white/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2.5 bg-red-100 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">{stats.criticals}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Blockers</span>
                </div>
              </div>

              <div className="p-4 bg-white/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">{stats.highs}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">High Risks</span>
                </div>
              </div>

              <div className="p-4 bg-white/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    ${Math.round(stats.monthlySavings)}/mo
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">FinOps Waste</span>
                </div>
              </div>

              <div className="p-4 bg-white/90 dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">
                    {findings.filter(f => f.fix).length}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Auto-Fixes</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
