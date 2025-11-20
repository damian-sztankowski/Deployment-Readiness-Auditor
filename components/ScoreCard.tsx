import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ScoreCardProps {
  score: number;
  summary: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, summary }) => {
  const validScore = typeof score === 'number' ? score : 0;
  
  const data = [
    { name: 'Score', value: validScore },
    { name: 'Remaining', value: 100 - validScore },
  ];

  // Dynamic colors based on score
  let startColor = '#4ade80'; // Green start
  let endColor = '#22c55e';   // Green end
  
  if (validScore < 80) {
    startColor = '#facc15'; // Yellow start
    endColor = '#eab308';   // Yellow end
  }
  if (validScore < 50) {
    startColor = '#f87171'; // Red start
    endColor = '#ef4444';   // Red end
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden h-full transition-colors z-10">
       {/* Background decorative blob */}
      <div className={`absolute top-0 left-0 w-2 h-full ${validScore >= 80 ? 'bg-emerald-500' : validScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
      
      {/* Chart Container */}
      <div id="score-pie-chart" className="relative w-48 h-48 flex-shrink-0 z-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={startColor} />
                    <stop offset="100%" stopColor={endColor} />
                </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={85}
              startAngle={180}
              endAngle={0}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
            >
              <Cell key="score" fill="url(#scoreGradient)" />
              <Cell key="rest" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Text Overlay - Positioned absolutely over the chart */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4 z-30">
          <span className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">{validScore}</span>
          <span className="text-xs text-slate-400 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">Overall</span>
        </div>
      </div>

      <div className="flex-1 z-10 relative">
        <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Readiness Assessment</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                validScore >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                validScore >= 50 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800' : 
                'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
            }`}>
                {validScore >= 80 ? 'DEPLOYABLE' : validScore >= 50 ? 'NEEDS REVIEW' : 'DO NOT DEPLOY'}
            </span>
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">{summary}</p>
      </div>
    </div>
  );
};