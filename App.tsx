
import React, { useState, useEffect } from 'react';
import { Header, ViewType } from './components/Header';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { LoadingAnimation } from './components/LoadingAnimation';
import { SplashPage } from './components/SplashPage';
import { About } from './components/About';
import { Features } from './components/Features';
import { HistorySidebar } from './components/HistorySidebar';
import { OnboardingTour } from './components/OnboardingTour';
import { Footer } from './components/Footer';
import { analyzeInfrastructure } from './services/geminiService';
import { MOCK_AUDIT_RESULT } from './services/mockData';
import { AnalysisState, AuditResult, HistoryItem } from './types';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('assessment');
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dra-history');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dra-theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dra-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dra-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('dra-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (result: AuditResult) => {
    const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
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
    setIsDemoMode(false);
    setAnalysis({ isLoading: false, error: null, result: item.result });
    setIsInputMinimized(true);
    setCurrentView('assessment');
  };

  const handleRunDemo = async () => {
    setShowSplash(false);
    setIsDemoMode(true);
    setIsInputMinimized(true);
    setCurrentView('assessment');
    setAnalysis({ isLoading: true, error: null, result: null });
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setAnalysis({ isLoading: false, error: null, result: MOCK_AUDIT_RESULT });
  };

  const handleAnalyze = async (code: string) => {
    setIsDemoMode(false);
    setIsInputMinimized(true);
    setAnalysis({ isLoading: true, error: null, result: null });
    
    try {
      const result = await analyzeInfrastructure(code);
      setAnalysis({ isLoading: false, error: null, result });
      addToHistory(result);
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
    if (isDemoMode) {
      setIsDemoMode(false);
      setAnalysis({ isLoading: false, error: null, result: null });
      setIsInputMinimized(false);
    }
    setShowSplash(false);
  };
  
  const handleNavigate = (view: ViewType) => setCurrentView(view);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#020617] transition-colors duration-500 relative font-sans text-slate-900 dark:text-slate-100">
      
      <OnboardingTour startTour={!showSplash} />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(28,37,65,1)_0%,rgba(2,6,23,0)_75%)]"></div>
        <div className="absolute inset-0">
            <div className="absolute top-[-10%] left-[-5%] w-[80vw] h-[80vw] bg-indigo-500/5 rounded-full blur-[160px] animate-blob" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[70vw] h-[70vw] bg-violet-500/5 rounded-full blur-[140px] animate-blob animation-delay-4000" />
        </div>
        <div className="absolute inset-0 opacity-[0.1]" style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(2,6,23,1)_100%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-grow w-full">
        {showSplash ? (
          <SplashPage onStart={handleStart} onRunDemo={handleRunDemo} />
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
            
            <main className="flex-1 w-full max-w-[2200px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24 py-12 md:py-16">
              
              {currentView === 'about' && (
                  <About onStartAssessment={() => setCurrentView('assessment')} />
              )}

              {currentView === 'features' && (
                  <Features />
              )}

              <div className={currentView === 'assessment' ? 'block animate-enter' : 'hidden'}>
                  {isDemoMode && (
                    <div className="max-w-5xl mx-auto mb-8 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between text-indigo-600 dark:text-indigo-400 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                            <span className="text-sm font-black uppercase tracking-widest">Interactive Showcase Mode Active</span>
                        </div>
                        <button 
                            onClick={() => { setIsDemoMode(false); setAnalysis({ ...analysis, result: null }); setIsInputMinimized(false); }}
                            className="text-xs font-bold underline underline-offset-4 hover:text-indigo-800"
                        >
                            Exit Showcase & Run Live Audit
                        </button>
                    </div>
                  )}

                  {!analysis.result && !analysis.isLoading && (
                  <div className="max-w-5xl mx-auto mb-16 text-center">
                      <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.85]">
                          Architect with<br/>
                          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent inline-block pb-2">Confidence.</span>
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto font-medium">
                          Evaluate infrastructure in real-time against the <span className="text-indigo-600 dark:text-indigo-400 font-bold">Google Cloud Architecture Framework</span> and international compliance benchmarks.
                      </p>
                  </div>
                  )}

                  <div className="mb-16 transition-all duration-700 ease-in-out">
                      <InputSection 
                        onAnalyze={handleAnalyze} 
                        isAnalyzing={analysis.isLoading} 
                        minimized={isInputMinimized}
                        onToggleMinimize={() => setIsInputMinimized(!isInputMinimized)}
                        onRunDemo={handleRunDemo}
                      />
                  </div>

                  {analysis.isLoading && (
                  <div className="mb-12">
                      <LoadingAnimation />
                  </div>
                  )}

                  {analysis.error && (
                  <div className="mb-12 max-w-5xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-8 flex items-center gap-6 text-red-700 dark:text-red-300">
                      <div className="p-4 bg-red-100 dark:bg-red-900/40 rounded-2xl shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                      </div>
                      <span className="font-bold text-xl">{analysis.error}</span>
                  </div>
                  )}

                  {analysis.result && (
                  <div className="mb-24 mt-16">
                      <Dashboard result={analysis.result} isDemo={isDemoMode} />
                  </div>
                  )}
              </div>
            </main>
            
            <Footer lastResult={analysis.result} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
