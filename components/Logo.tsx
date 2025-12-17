import React from 'react';
import { ShieldCheck, Zap, Cpu } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', animate = true }) => {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', orb: 'w-1 h-1' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6', orb: 'w-1.5 h-1.5' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10', orb: 'w-2.5 h-2.5' },
    xl: { container: 'w-32 h-32', icon: 'w-16 h-16', orb: 'w-4 h-4' },
  };

  const s = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center ${s.container} ${className} group`}>
      
      {/* 1. LAYER: Morphing Aura Pulse */}
      <div 
        className={`absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 blur-2xl rounded-full transition-opacity duration-700 ${animate ? 'animate-logo-pulse' : 'opacity-0'}`}
      ></div>

      {/* 2. LAYER: Liquid Tech Morphing Core */}
      <div 
        className={`absolute inset-0 border border-indigo-500/20 dark:border-indigo-400/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-xl ${animate ? 'animate-morph' : 'rounded-2xl'}`}
        style={{ animationDuration: '10s' }}
      ></div>

      {/* 3. LAYER: Rotating Hexagonal Frame (Geometric Stability) */}
      <div className={`absolute inset-1 flex items-center justify-center opacity-40 dark:opacity-20 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '20s' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="1.5" strokeDasharray="10 5">
          <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
        </svg>
      </div>

      {/* 4. LAYER: Data Pulse Ellipse */}
      <div className={`absolute inset-0 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '4s' }}>
        <div 
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.orb} bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)] border border-white/50 animate-pulse`}
        ></div>
      </div>

      {/* 5. LAYER: Secondary Counter-Rotating Node */}
      <div className={`absolute inset-4 ${animate ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '7s', animationDirection: 'reverse' }}>
        <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]"
        ></div>
      </div>

      {/* 6. LAYER: Central Semantic Icon (Architectural Core) */}
      <div className={`relative flex items-center justify-center z-10 transition-all duration-500 group-hover:scale-125`}>
        {/* Diamond Facet Backdrop */}
        <div className="absolute inset-0 bg-indigo-600/5 dark:bg-indigo-400/5 rotate-45 scale-125 rounded shadow-inner"></div>
        
        <div className={`${animate ? 'animate-wiggle' : ''} drop-shadow-[0_0_15px_rgba(79,70,229,0.4)]`}>
           <ShieldCheck 
             className={`${s.icon} text-indigo-700 dark:text-indigo-300 transition-colors duration-500 group-hover:text-indigo-500`} 
             strokeWidth={2} 
           />
        </div>
        
        {/* Floating Indicator */}
        <div className="absolute -top-1 -right-1">
           <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
        </div>
      </div>

      {/* Hover Interaction: Tooltip-like label for large logos */}
      {(size === 'lg' || size === 'xl') && (
          <div className="absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 backdrop-blur-md">
                DRA Active
            </span>
          </div>
      )}
    </div>
  );
};
