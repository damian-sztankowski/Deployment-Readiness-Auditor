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
      badgeOffsetTop: 'translate-x-[5px] -translate-y-[4px]',
      badgeOffsetBottom: '-translate-x-[5px] translate-y-[4px]'
    },
    md: {
      container: 'w-11 h-11',
      icon: 'w-5 h-5',
      orb: 'w-1.5 h-1.5',
      badgeSize: 'p-1',
      badgeIcon: 'w-2.5 h-2.5',
      badgeOffsetTop: 'translate-x-[8px] -translate-y-[6px]',
      badgeOffsetBottom: '-translate-x-[8px] translate-y-[6px]'
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-10 h-10',
      orb: 'w-2.5 h-2.5',
      badgeSize: 'p-2',
      badgeIcon: 'w-4 h-4',
      badgeOffsetTop: 'translate-x-[16px] -translate-y-[10px]',
      badgeOffsetBottom: '-translate-x-[16px] translate-y-[10px]'
    },
    xl: {
      container: 'w-28 h-28',
      icon: 'w-14 h-14',
      orb: 'w-3.5 h-3.5',
      badgeSize: 'p-3',
      badgeIcon: 'w-5 h-5',
      badgeOffsetTop: 'translate-x-[22px] -translate-y-[14px]',
      badgeOffsetBottom: '-translate-x-[22px] translate-y-[14px]'
    }
  };

  const s = sizeMap[size];

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${s.container} ${className} group`}
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 bg-blue-500/15 dark:bg-sky-400/20 blur-xl rounded-full transition-all duration-700 ${
          animate ? 'animate-logo-pulse' : 'opacity-0'
        }`}
      />

      <div
        className={`absolute inset-0 border border-blue-500/25 dark:border-sky-400/30 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md shadow-lg ${
          animate ? 'animate-morph' : 'rounded-2xl'
        }`}
      />

      <div
        className={`absolute inset-1.5 border border-sky-500/15 dark:border-sky-400/15 bg-blue-500/5 dark:bg-sky-400/5 ${
          animate ? 'animate-morph' : 'rounded-xl'
        }`}
        style={{ animationDirection: 'reverse' }}
      />

      <div
        className={`absolute inset-0.5 flex items-center justify-center opacity-25 ${
          animate ? 'animate-spin-slow' : ''
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-none stroke-blue-600 dark:stroke-sky-400"
          strokeWidth="1.4"
          strokeDasharray="8 4"
        >
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
        </svg>
      </div>

      <div
        className={`absolute inset-0 ${animate ? 'animate-spin-slow' : ''}`}
        style={{ animationDuration: '5s' }}
      >
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.orb} bg-sky-500 dark:bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.9)] border border-white/50`}
        />
      </div>

      <div className="relative flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-105">
        <div className={animate ? 'animate-wiggle' : ''}>
          <ShieldCheck
            className={`${s.icon} text-blue-600 dark:text-sky-300`}
            strokeWidth={2.4}
          />
        </div>
        <div className="absolute -top-1 -right-1">
          <Zap className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500" />
        </div>
      </div>

      <div className={`absolute top-0 right-0 ${s.badgeOffsetTop} z-20 pointer-events-none`}>
        <div className={animate ? 'animate-float-orbit-1' : ''}>
          <div
            className={`bg-white dark:bg-slate-850 ${s.badgeSize} rounded-lg shadow-md border border-emerald-500/30 flex items-center justify-center`}
          >
            <Lock className={`${s.badgeIcon} text-emerald-600 dark:text-emerald-400`} />
          </div>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 ${s.badgeOffsetBottom} z-20 pointer-events-none`}>
        <div className={animate ? 'animate-float-orbit-2' : ''}>
          <div
            className={`bg-white dark:bg-slate-850 ${s.badgeSize} rounded-lg shadow-md border border-sky-500/30 flex items-center justify-center`}
          >
            <Activity className={`${s.badgeIcon} text-blue-600 dark:text-sky-400`} />
          </div>
        </div>
      </div>
    </div>
  );
};
