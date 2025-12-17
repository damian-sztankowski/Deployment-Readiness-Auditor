import React from 'react';
import { LayoutGrid, Info, Moon, Sun, History } from 'lucide-react';
import { Logo } from './Logo';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={() => onNavigate('about')}
        >
          <Logo size="md" className="group-hover:scale-110 transition-transform duration-300" />
          
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              AUDITOR<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-all duration-300">
              DEPLOYMENT READINESS
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
                    id="header-history-btn"
                    onClick={onToggleHistory}
                    className="p-2 md:p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
                    title="Audit History"
                >
                    <History className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                <button 
                    id="header-theme-btn"
                    onClick={toggleTheme}
                    className="p-2 md:p-2.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {isDarkMode ? (
                        <Sun className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                        <Moon className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};