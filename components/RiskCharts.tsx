import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { ExternalLink } from 'lucide-react';
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

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden h-full transition-colors">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-10 -mt-10 z-0" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">WAF Pillar Analysis</h3>
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
      
      {/* Fixed height container to prevent growing with flexbox stretching */}
      <div id="risk-radar-chart" className="h-[300px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
            <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} 
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
              animationDuration={1000}
              animationEasing="ease-out"
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

      <div className="mt-4 space-y-2 relative z-10">
        {categories.map((cat) => (
            <div key={cat.name} className="flex justify-between items-center text-sm group cursor-default">
                <span className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cat.name}</span>
                <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                cat.score >= 90 ? 'bg-emerald-500' : 
                                cat.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${cat.score}%` }}
                        />
                    </div>
                    <span className={`font-bold w-8 text-right ${
                        cat.score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 
                        cat.score >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`}>{cat.score}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};