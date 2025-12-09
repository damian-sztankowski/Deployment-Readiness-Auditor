import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { LoadingAnimation } from './components/LoadingAnimation';
import { SplashPage } from './components/SplashPage';
import { About } from './components/About';
import { HistorySidebar } from './components/HistorySidebar';
import { analyzeInfrastructure } from './services/geminiService';
import { AnalysisState, AuditResult, HistoryItem } from './types';
import { Github, Linkedin } from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<'about' | 'assessment'>('assessment');
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dra-history');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Initialize Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dra-theme');
      if (saved) {
        return saved === 'dark';
      }
      return true;
    }
    return true;
  });
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  // Theme Persistence
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dra-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dra-theme', 'light');
    }
  }, [isDarkMode]);

  // History Persistence
  useEffect(() => {
    localStorage.setItem('dra-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (result: AuditResult) => {
    const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        // Score is removed, we rely on findings now
        summary: result.summary,
        result: result
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20)); 
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setAnalysis({
        isLoading: false,
        error: null,
        result: item.result
    });
    setIsInputMinimized(true);
    setCurrentView('assessment');
  };

  const handleAnalyze = async (code: string) => {
    setAnalysis({ isLoading: true, error: null, result: null });
    try {
      const result = await analyzeInfrastructure(code);
      setAnalysis({ isLoading: false, error: null, result });
      addToHistory(result);
      setIsInputMinimized(true);
    } catch (error: any) {
      setAnalysis({ 
        isLoading: false, 
        error: error.message || "An unexpected error occurred during analysis.", 
        result: null 
      });
      setIsInputMinimized(false);
    }
  };

  const handleStart = () => {
    setShowSplash(false);
  };

  const handleNavigate = (view: 'about' | 'assessment') => {
      setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-indigo-100 selection:text-indigo-800 dark:selection:bg-indigo-900 dark:selection:text-indigo-200 flex flex-col relative font-sans text-slate-900 dark:text-slate-100">
      
      {/* --- GLOBAL BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Animated Blobs */}
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-indigo-200/20 dark:bg-indigo-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob opacity-70 dark:opacity-40" />
            <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-violet-200/20 dark:bg-violet-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-2000 opacity-70 dark:opacity-40" />
            <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-fuchsia-200/20 dark:bg-fuchsia-500/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-4000 opacity-70 dark:opacity-40" />
        </div>

        {/* Radial Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,transparent,white)] dark:bg-[radial-gradient(circle_800px_at_50%_50%,transparent,#020617)]"></div>
      </div>

      {/* --- CONTENT --- */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {showSplash ? (
          <SplashPage onStart={handleStart} />
        ) : (
          <>
            <Header 
              currentView={currentView} 
              onNavigate={handleNavigate} 
              isDarkMode={isDarkMode}
              toggleTheme={() => setIsDarkMode(!isDarkMode)}
              onToggleHistory={() => setShowHistory(true)}
            />
            
            <HistorySidebar 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
                history={history}
                onSelect={restoreHistoryItem}
                onDelete={deleteHistoryItem}
            />
            
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* About View */}
              {currentView === 'about' && (
                  <About onStartAssessment={() => setCurrentView('assessment')} />
              )}

              {/* Assessment View */}
              <div className={currentView === 'assessment' ? 'block animate-enter' : 'hidden'}>
                  {!analysis.result && !analysis.isLoading && (
                  <div className="max-w-3xl mx-auto mb-10 text-center">
                      <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                          Architect with Confidence.
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                          Instant analysis against the <span className="font-semibold text-indigo-600 dark:text-indigo-400">Google Cloud Architecture Framework</span>. 
                          Detect security risks and reliability gaps.
                      </p>
                  </div>
                  )}

                  <div className="mb-8 transition-all duration-500 ease-in-out">
                      <InputSection 
                      onAnalyze={handleAnalyze} 
                      isAnalyzing={analysis.isLoading} 
                      minimized={isInputMinimized}
                      onToggleMinimize={() => setIsInputMinimized(!isInputMinimized)}
                      />
                  </div>

                  {analysis.isLoading && (
                  <div className="mb-4">
                      <LoadingAnimation />
                  </div>
                  )}

                  {analysis.error && (
                  <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 text-red-700 dark:text-red-300 animate-in fade-in">
                      <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      </div>
                      <span className="font-medium">{analysis.error}</span>
                  </div>
                  )}

                  {analysis.result && (
                  <div className="mb-16 mt-8">
                      <Dashboard result={analysis.result} />
                  </div>
                  )}
              </div>
            </main>
            
            <footer className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 mt-auto relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center gap-6 relative z-10">
                
                {/* Centered Glowing Text with Shine */}
                <div className="relative group cursor-default">
                    <p className="text-2xl md:text-3xl font-extrabold text-center tracking-tight relative z-10">
                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent bg-300% animate-gradient drop-shadow-sm">
                        Deployment Readiness Auditor
                    </span>
                    </p>
                    
                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-indigo-300/20 to-transparent -skew-x-12 translate-x-[-200%] animate-shine"></div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                   <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors transform hover:scale-110 duration-200">
                      <Github className="w-5 h-5" />
                   </a>
                   <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors transform hover:scale-110 duration-200">
                      <Linkedin className="w-5 h-5" />
                   </a>
                </div>
                
                <a 
                    href="https://docs.cloud.google.com/architecture/framework" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                    Google Cloud Architecture Framework Official Site
                </a>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default App;