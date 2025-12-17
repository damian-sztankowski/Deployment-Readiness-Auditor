import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', animate = true }) => {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', orb: 'w-1 h-1' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', orb: 'w-1.5 h-1.5' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', orb: 'w-2 h-2' },
    xl: { container: 'w-24 h-24', icon: 'w-12 h-12', orb: 'w-3 h-3' },
  };

  const s = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${s.container} ${className}`}>
      {/* Outer Hexagon - Structural base */}
      <div className={`absolute inset-0 flex items-center justify-center ${animate ? 'animate-spin-slow' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-indigo-100/30 dark:fill-indigo-500/10 stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2">
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
        </svg>
      </div>

      {/* Pulsing Glow Layer */}
      <div className={`absolute inset-0 bg-indigo-500/20 blur-xl rounded-full ${animate ? 'animate-logo-pulse' : ''}`}></div>

      {/* Orbiting Tech Node */}
      <div className={`absolute inset-0 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.orb} bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]`}></div>
      </div>

      {/* Central Brand Mark */}
      <div className={`relative flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110`}>
        {/* Faceted Shield Concept */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg rotate-45 opacity-10"></div>
        <div className={`${animate ? 'animate-wiggle' : ''}`}>
           <ShieldCheck 
             className={`${s.icon} text-indigo-600 dark:text-indigo-400 drop-shadow-sm filter`} 
             strokeWidth={2.5} 
           />
        </div>
        
        {/* Minimalist Zap overlay */}
        <div className="absolute -bottom-0.5 -right-0.5 animate-pulse">
           <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 drop-shadow-sm" />
        </div>
      </div>
    </div>
  );
};