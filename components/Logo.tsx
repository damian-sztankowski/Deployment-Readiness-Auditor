import React from 'react';
import { ShieldCheck, Zap, Lock, Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', animate = true }) => {
  const sizeMap = {
    sm: { 
      container: 'w-8 h-8', 
      icon: 'w-4 h-4', 
      orb: 'w-1 h-1',
      badgeSize: 'p-1',
      badgeIcon: 'w-2 h-2',
      badgeOffsetTop: 'translate-x-[6px] -translate-y-[4px]',
      badgeOffsetBottom: '-translate-x-[6px] translate-y-[4px]'
    },
    md: { 
      container: 'w-12 h-12', 
      icon: 'w-6 h-6', 
      orb: 'w-1.5 h-1.5',
      badgeSize: 'p-1.5',
      badgeIcon: 'w-3 h-3',
      badgeOffsetTop: 'translate-x-[10px] -translate-y-[8px]',
      badgeOffsetBottom: '-translate-x-[10px] translate-y-[8px]'
    },
    lg: { 
      container: 'w-20 h-20', 
      icon: 'w-10 h-10', 
      orb: 'w-2.5 h-2.5',
      badgeSize: 'p-2.5',
      badgeIcon: 'w-4 h-4',
      badgeOffsetTop: 'translate-x-[18px] -translate-y-[12px]',
      badgeOffsetBottom: '-translate-x-[18px] translate-y-[12px]'
    },
    xl: { 
      container: 'w-32 h-32', 
      icon: 'w-16 h-16', 
      orb: 'w-4 h-4',
      badgeSize: 'p-4',
      badgeIcon: 'w-6 h-6',
      badgeOffsetTop: 'translate-x-[28px] -translate-y-[16px]',
      badgeOffsetBottom: '-translate-x-[28px] translate-y-[16px]'
    },
  };

  const s = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${s.container} ${className} group`}>
      
      {/* 1. LAYER: Base Liquid Glow */}
      <div 
        className={`absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 blur-xl rounded-full transition-all duration-700 group-hover:scale-150 ${animate ? 'animate-logo-pulse' : 'opacity-0'}`}
      ></div>

      {/* 2. LAYER: Liquid Morphing Core Outer (The Shell) */}
      <div 
        className={`absolute inset-0 border border-indigo-500/30 dark:border-indigo-400/30 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md shadow-2xl ${animate ? 'animate-morph' : 'rounded-2xl'}`}
        style={{ animationDuration: '8s' }}
      ></div>

      {/* 3. LAYER: Inner Morphing Core (Secondary Layer for depth) */}
      <div 
        className={`absolute inset-1.5 border border-indigo-500/10 dark:border-indigo-400/10 bg-indigo-500/5 dark:bg-indigo-400/5 ${animate ? 'animate-morph' : 'rounded-xl'}`}
        style={{ animationDuration: '6s', animationDirection: 'reverse' }}
      ></div>

      {/* 4. LAYER: Rotating Hex Frame */}
      <div className={`absolute inset-0.5 flex items-center justify-center opacity-30 dark:opacity-20 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '15s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="1.2" strokeDasharray="8 4">
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
        </svg>
      </div>

      {/* 5. LAYER: Data Orbit Node */}
      <div className={`absolute inset-0 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '3.5s' }}>
        <div 
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.orb} bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)] border border-white/40 animate-pulse`}
        ></div>
      </div>

      {/* 6. LAYER: Central Icon Core */}
      <div className={`relative flex items-center justify-center z-10 transition-all duration-500 group-hover:scale-110`}>
        <div className={`${animate ? 'animate-wiggle' : ''} drop-shadow-[0_0_12px_rgba(79,70,229,0.5)]`}>
           <ShieldCheck 
             className={`${s.icon} text-indigo-700 dark:text-indigo-300 transition-colors duration-500 group-hover:text-indigo-500`} 
             strokeWidth={2.5} 
           />
        </div>
        
        {/* Detail Spark */}
        <div className="absolute -top-1 -right-1">
           <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
        </div>
      </div>

      {/* 7. LAYER: Orbiting Badges - Scalable and Consistent */}
      {/* Security Lock (Top Right) */}
      <div className={`absolute top-0 right-0 ${s.badgeOffsetTop} z-20 pointer-events-none`}>
        <div className={animate ? 'animate-float-orbit-1' : ''}>
          <div className={`bg-slate-900/85 dark:bg-slate-800/85 backdrop-blur-2xl ${s.badgeSize} rounded-lg md:rounded-xl shadow-2xl border border-emerald-500/30 flex items-center justify-center ring-1 ring-white/5 pointer-events-auto`}>
            <Lock className={`${s.badgeIcon} text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]`} />
          </div>
        </div>
      </div>

      {/* Activity Pulse (Bottom Left) */}
      <div className={`absolute bottom-0 left-0 ${s.badgeOffsetBottom} z-20 pointer-events-none`}>
        <div className={animate ? 'animate-float-orbit-2' : ''}>
          <div className={`bg-slate-900/85 dark:bg-slate-800/85 backdrop-blur-2xl ${s.badgeSize} rounded-lg md:rounded-xl shadow-2xl border border-amber-500/30 flex items-center justify-center ring-1 ring-white/5 pointer-events-auto`}>
            <Activity className={`${s.badgeIcon} text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]`} />
          </div>
        </div>
      </div>

      {/* Floating Metadata for Large Sizes */}
      {(size === 'lg' || size === 'xl') && (
          <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-20">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 bg-white/90 dark:bg-slate-900/90 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800 backdrop-blur-xl shadow-lg">
                DRA CORE 2.5 ACTIVE
            </span>
          </div>
      )}
    </div>
  );
};
