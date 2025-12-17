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
    <header className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-all duration-500">
      <div className="max-w-[2200px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24 h-20 md:h-24 flex items-center justify-between">
        
        <div 
          className="flex items-center gap-5 cursor-pointer group" 
          onClick={() => onNavigate('about')}
        >
          <Logo size="md" className="group-hover:scale-110 transition-transform duration-500" />
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              DRA<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </h1>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-all duration-300">
              Deployment Readiness Auditor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-2 bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50">
            <button 
                onClick={() => onNavigate('about')}
                className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300
                    ${currentView === 'about' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }
                `}
            >
                <Info className="w-4 h-4" />
                About
            </button>

            <button 
                onClick={() => onNavigate('assessment')}
                className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300
                    ${currentView === 'assessment' 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }
                `}
            >
                <LayoutGrid className="w-4 h-4" />
                Audit Engine
            </button>
            </nav>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <button 
                    onClick={onToggleHistory}
                    className="p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110"
                    title="Audit History"
                >
                    <History className="w-5 h-5" />
                </button>

                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110"
                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};