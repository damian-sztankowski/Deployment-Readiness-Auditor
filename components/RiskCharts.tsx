import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ExternalLink, Sparkles } from 'lucide-react';
import { CategoryScore } from '../types';

interface RiskChartsProps {
  categories: CategoryScore[];
}

// Custom Tooltip to show full pillar names and styled score
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur p-3 border border-indigo-100 dark:border-slate-700 shadow-xl rounded-xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-slate-800 dark:text-white mb-1 text-sm border-b border-slate-100 dark:border-slate-700 pb-1">{data.fullSubject}</p>
        <div className="flex items-center gap-2 text-xs mt-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Score:</span>
          <span className={`font-bold ${
             data.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : data.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
          }`}>{data.score}/100</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RiskCharts: React.FC<RiskChartsProps> = ({ categories }) => {
  const data = categories.map(c => ({
    subject: c.name.replace('Optimization', 'Opt.').replace('Efficiency', 'Eff.'),
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden h-full transition-colors group">
      {/* Decorative Top Border Glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>

      {/* Pulsing Background Background Orbit/Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse z-0 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">WAF Pillar Analysis</h3>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        </div>
        <a 
            href="https://docs.cloud.google.com/architecture/framework"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
            title="View Official Google Cloud Architecture Framework"
        >
            <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      {/* Responsive height container with breathing animation */}
      <div id="risk-radar-chart" className="min-h-[250px] h-[30vh] max-h-[400px] w-full relative z-10 animate-radar">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="4 4" />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Pillar Score"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#818cf8"
              fillOpacity={0.4}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="cubic-bezier(0.34, 1.56, 0.64, 1)" // Bouncy initial entry
              activeDot={{
                r: 6,
                fill: '#4f46e5',
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
             <Tooltip 
                content={<CustomTooltip />} 
                cursor={false} 
                animationDuration={300}
                isAnimationActive={true}
             />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-3 relative z-10">
        {categories.map((cat) => (
            <div key={cat.name} className="flex justify-between items-center text-sm group/item cursor-default">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getBgColor(cat.score)} shadow-[0_0_8px_rgba(0,0,0,0.1)] group-hover/item:scale-150 transition-transform duration-300`} />
                    <span className={`font-semibold transition-colors ${getStatusColor(cat.score)} group-hover/item:opacity-80`}>
                        {cat.name}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBgColor(cat.score)}`}
                            style={{ width: `${cat.score}%` }}
                        />
                    </div>
                    <span className={`font-black w-8 text-right tabular-nums ${getStatusColor(cat.score)}`}>
                        {cat.score}
                    </span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};