import React from 'react';

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-enter">
      
      {/* Top Row: Score & Key Metrics */}
      <div className="w-full mb-6">
        {/* Score Card Skeleton */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 dark:bg-slate-800" />
            <div className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 animate-pulse" />
            <div className="flex-1 w-full z-10 space-y-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg w-48 animate-pulse" />
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-24 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-11/12 animate-pulse" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/5 animate-pulse" />
                </div>
            </div>
        </div>
      </div>

      {/* Middle Row: Charts & Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
         
         {/* Charts Skeleton */}
         <div className="lg:col-span-1 w-full bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-[500px] flex flex-col relative overflow-hidden">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-40 mb-8 animate-pulse relative z-10" />
            <div className="flex-1 flex items-center justify-center relative z-10">
                <div className="w-[80%] aspect-square bg-slate-100 dark:bg-slate-800 rounded-full opacity-60 animate-pulse" />
            </div>
            <div className="mt-8 space-y-3 relative z-10">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24 animate-pulse" />
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                            <div className="w-6 h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
         </div>
         
         {/* Findings Skeleton */}
         <div className="lg:col-span-2 w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20 animate-pulse" />
            </div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-200 dark:border-l-slate-700 rounded-r-xl rounded-l-sm bg-white dark:bg-slate-900 p-5">
                    <div className="flex items-start gap-4 animate-pulse">
                        <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex justify-between items-start gap-4">
                                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                                <div className="flex gap-3">
                                    <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                                    <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                                </div>
                            </div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                        </div>
                    </div>
                </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};