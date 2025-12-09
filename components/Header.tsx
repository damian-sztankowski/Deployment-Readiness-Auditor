import React from 'react';
import { Hexagon, Zap, LayoutGrid, Info, Moon, Sun, History } from 'lucide-react';

interface HeaderProps {
  currentView: 'about' | 'assessment';
  onNavigate: (view: 'about' | 'assessment') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onToggleHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, isDarkMode, toggleTheme, onToggleHistory }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100 dark:border-slate-800 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Section - Automated & Catchy */}
        <div 
          className="flex items-center gap-3 cursor-pointer group animate-float" 
          onClick={() => onNavigate('about')}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
             {/* Logo Base - Spins continuously slowly */}
             <Hexagon 
                className="w-10 h-10 text-indigo-600 dark:text-indigo-500 fill-indigo-100/50 dark:fill-indigo-900/50 animate-spin-slow" 
                strokeWidth={1.5} 
             />
             
             {/* Logo Inner - Wiggles automatically */}
             <div className="absolute flex items-center justify-center animate-wiggle">
                <Zap 
                    className="w-5 h-5 text-indigo-600 dark:text-indigo-400 drop-shadow-md" 
                    strokeWidth={2.5} 
                />
             </div>
             
             {/* Decorative Glow - Pulses automatically */}
             <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full opacity-50 animate-pulse"></div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              DRA
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:tracking-[0.2em] transition-all duration-300">
              Auditor
            </span>
          </div>
        </div>

        {/* Navigation & Settings */}
        <div className="flex items-center gap-2 md:gap-4">
            <nav className="hidden md:flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <button 
                onClick={() => onNavigate('about')}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${currentView === 'about' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }
                `}
            >
                <Info className={`w-4 h-4 ${currentView === 'about' ? 'text-indigo-500 dark:text-indigo-300' : ''}`} />
                About
            </button>

            <button 
                onClick={() => onNavigate('assessment')}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${currentView === 'assessment' 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }
                `}
            >
                <LayoutGrid className="w-4 h-4" />
                Audit
            </button>
            </nav>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <button 
                    onClick={onToggleHistory}
                    className="p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
                    title="Audit History"
                >
                    <History className="w-5 h-5" />
                </button>

                <button 
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};