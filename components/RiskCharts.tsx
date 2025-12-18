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
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur p-4 border border-indigo-100 dark:border-slate-700 shadow-2xl rounded-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200">
        <p className="font-black text-slate-800 dark:text-white mb-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-2 uppercase tracking-wider">{data.fullSubject}</p>
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Current Integrity</span>
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

// Custom Dot component with stable pulse animation
const PulsingDot = (props: any) => {
  const { cx, cy, fill } = props;
  
  // Guard against zero coordinates which cause artifacts during initial ResponsiveContainer layout
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
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill={fill} 
        className="radar-dot-pulse" 
      />
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={fill} 
        stroke="white" 
        strokeWidth={1.5} 
        className="transition-all duration-300"
      />
    </g>
  );
};

export const RiskCharts: React.FC<RiskChartsProps> = ({ categories }) => {
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden h-full transition-all duration-500 group">
      {/* Dynamic Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] group-hover:bg-indigo-500/15 transition-colors duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[60px]" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Pillar Matrix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GCP Architecture Framework</p>
            </div>
        </div>
        <a 
            href="https://docs.cloud.google.com/architecture/framework"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 shadow-sm"
            title="View Official Google Cloud Architecture Framework"
        >
            <ExternalLink className="w-5 h-5" />
        </a>
      </div>
      
      <div id="risk-radar-chart" className="flex-1 min-h-[300px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
            <PolarGrid 
              stroke="currentColor" 
              className="text-slate-200 dark:text-slate-800" 
              strokeDasharray="4 4" 
              gridType="polygon"
            />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false} 
            />
            
            {/* Background Glow Radar */}
            <Radar
              name="Glow"
              dataKey="score"
              stroke="none"
              fill="#818cf8"
              fillOpacity={0.08}
              isAnimationActive={false} // Disabled animation on background glow to reduce noise
            />

            {/* Primary Radar */}
            <Radar
              name="Pillar Score"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#radarGradient)"
              fillOpacity={0.6}
              dot={<PulsingDot />}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
              activeDot={{
                r: 8,
                fill: '#4f46e5',
                stroke: '#fff',
                strokeWidth: 2,
                className: 'filter drop-shadow-lg'
              }}
            />

            {/* Definitions for Gradients */}
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
              </linearGradient>
            </defs>

             <Tooltip 
                content={<CustomTooltip />} 
                cursor={false} 
                animationDuration={300}
             />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-4 relative z-10 bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        {categories.map((cat) => (
            <div key={cat.name} className="flex justify-between items-center text-sm group/item cursor-default">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getBgColor(cat.score)} shadow-[0_0_12px_rgba(0,0,0,0.1)] group-hover/item:scale-125 transition-transform duration-300 ring-2 ring-white dark:ring-slate-900`} />
                    <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${getStatusColor(cat.score)} group-hover/item:opacity-80`}>
                        {cat.name}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-white/10">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getBgColor(cat.score)}`}
                            style={{ width: `${cat.score}%` }}
                        />
                    </div>
                    <span className={`text-xs font-black w-8 text-right tabular-nums ${getStatusColor(cat.score)}`}>
                        {cat.score}
                    </span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};