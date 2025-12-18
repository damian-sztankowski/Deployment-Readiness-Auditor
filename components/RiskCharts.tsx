import React, { useState, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ExternalLink, Sparkles, BrainCircuit, ChevronRight, Info } from 'lucide-react';
import { CategoryScore } from '../types';

interface RiskChartsProps {
  categories: CategoryScore[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur p-4 border border-indigo-100 dark:border-slate-700 shadow-2xl rounded-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        <p className="font-black text-slate-800 dark:text-white mb-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-2 uppercase tracking-wider">{data.fullSubject}</p>
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Integrity</span>
          </div>
          <span className={`font-black text-sm ${
             data.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : data.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
          }`}>{data.score}/100</span>
        </div>
      </div>
    );
  }
  return null;
};

const PulsingDot = (props: any) => {
  const { cx, cy, fill } = props;
  if (cx === undefined || cy === undefined || cx <= 0 || cy <= 0) return null;
  return (
    <g>
      <style>{`
        @keyframes svgPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .radar-dot-pulse {
          transform-origin: center;
          transform-box: fill-box;
          animation: svgPulse 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <circle cx={cx} cy={cy} r={5} fill={fill} className="radar-dot-pulse" />
      <circle cx={cx} cy={cy} r={4} fill={fill} stroke="white" strokeWidth={1.5} />
    </g>
  );
};

export const RiskCharts: React.FC<RiskChartsProps> = ({ categories }) => {
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(
    categories.length > 0 ? categories.sort((a, b) => a.score - b.score)[0].name : null
  );

  const activeCategory = useMemo(() => 
    categories.find(c => c.name === activeCategoryName) || categories[0],
    [categories, activeCategoryName]
  );

  const data = categories.map(c => ({
    subject: c.name.replace('Optimization', 'Opt.').replace('Efficiency', 'Eff.').replace('Operational', 'Ops.'),
    fullSubject: c.name,
    score: c.score,
    fullMark: 100,
  }));

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden h-full transition-all duration-500 group">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px]" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Pillar Matrix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GCP Architecture Framework</p>
            </div>
        </div>
        <a href="https://docs.cloud.google.com/architecture/framework" target="_blank" className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm"><ExternalLink className="w-5 h-5" /></a>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8 items-stretch flex-1">
        {/* Radar Chart Section */}
        <div id="risk-radar-chart" className="flex-1 min-h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Pillar Score" dataKey="score" stroke="#6366f1" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.6} dot={<PulsingDot />} isAnimationActive={true} animationDuration={1000} />
                <defs>
                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={false} />
            </RadarChart>
            </ResponsiveContainer>
        </div>

        {/* AI Reasoning Section */}
        <div className="xl:w-80 flex flex-col gap-4 relative z-10">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex-1 flex flex-col shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reasoning Engine</span>
                </div>
                
                {activeCategory ? (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{activeCategory.name}</h4>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${getStatusColor(activeCategory.score)}`}>
                                {activeCategory.score}/100
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {activeCategory.explanation || "No specific details available for this score."}
                        </p>
                        
                        <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                                <Info className="w-3 h-3" />
                                Impact Outcome
                            </div>
                            <div className="mt-2 p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] italic text-slate-500 dark:text-slate-400 leading-snug">
                                {activeCategory.score < 70 
                                    ? "Critical gaps detected. Failure to remediate exposes high architectural risk." 
                                    : activeCategory.score < 90 
                                    ? "Baseline requirements met, but optimization opportunities exist." 
                                    : "Best-in-class implementation matching Google's gold standard."}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-[10px] uppercase font-bold">Select a pillar to view logic</div>
                )}
            </div>
        </div>
      </div>

      <div className="mt-8 space-y-2 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-2 block">Pillar Selection</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {categories.map((cat) => (
                <button 
                    key={cat.name} 
                    onClick={() => setActiveCategoryName(cat.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group/btn
                        ${activeCategoryName === cat.name 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBgColor(cat.score)}`} />
                        <span className={`text-[10px] font-black uppercase truncate transition-colors
                            ${activeCategoryName === cat.name ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}>
                            {cat.name.split(' ')[0]}
                        </span>
                    </div>
                    <ChevronRight className={`w-3 h-3 transition-transform ${activeCategoryName === cat.name ? 'text-indigo-400 translate-x-1' : 'text-slate-300 group-hover/btn:translate-x-1'}`} />
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};