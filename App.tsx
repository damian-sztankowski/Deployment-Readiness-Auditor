
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
import { AlertOctagon, ShieldAlert, Terminal, RefreshCw, Key, ShieldX, Globe, AlertCircle } from 'lucide-react';

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

  const renderError = (error: string) => {
    const errorCode = error.split(':')[0] || 'SYSTEM_FAILURE';
    const errorMsg = error.split(':').slice(1).join(':').trim() || error;
    const isConfigError = errorCode === 'CONFIG_ERROR';
    
    return (
      <div className="max-w-4xl mx-auto mb-16 animate-enter">
        <div className="bg-white dark:bg-[#0a0f1e] rounded-[2.5rem] border border-red-200 dark:border-red-900/40 shadow-3xl overflow-hidden">
          <div className="px-10 py-8 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-[#0a0f1e] border-b border-red-100 dark:border-red-900/30 flex items-center gap-6">
            <div className="p-4 bg-red-600 rounded-3xl shadow-xl shadow-red-500/20">
              <AlertOctagon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Audit Engine Halted</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-[0.2em]">{errorCode}</span>
                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">Protocol Check Required</span>
              </div>
            </div>
          </div>
          
          <div className="p-10 space-y-10">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-5">
              <div className="mt-1 shrink-0">
                <ShieldX className="w-6 h-6 text-red-500 opacity-60" />
              </div>
              <p className="text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {isConfigError && (
              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                 <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-black uppercase tracking-widest">Client-Side Diagnostics</span>
                 </div>
                 <div className="space-y-3 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-amber-100 dark:border-amber-900/20 pb-2">
                        <span className="text-slate-400 uppercase">Process Shim</span>
                        <span className="text-slate-600 dark:text-slate-300">Active</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 dark:border-amber-900/20 pb-2">
                        <span className="text-slate-400 uppercase">Current Key State</span>
                        <span className="text-red-500">Placeholder Detected</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400 uppercase">Injection Result</span>
                        <span className="text-amber-600">FAILED (Check Server routes)</span>
                    </div>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Deployment Fixes
                </h4>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Verify --set-env-vars</span>
                  </div>
                  <pre className="text-[10px] font-mono bg-slate-900 p-3 rounded-lg text-emerald-400 overflow-x-auto border border-slate-800">
                    gcloud run deploy ... --set-env-vars API_KEY=AIzaSy...
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" />
                  Credential Access
                </h4>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500">Verify the key is active in <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-500 underline font-bold">Google AI Studio</a>.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
               <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-xl transition-all text-[10px] uppercase tracking-widest"
              >
                Reload Application
              </button>
              <button 
                onClick={() => setAnalysis({ ...analysis, error: null })}
                className="flex items-center gap-3 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-widest"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Diagnostic
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50 dark:bg-[#020617] transition-colors duration-500 relative font-sans text-slate-900 dark:text-slate-100">
      
      <OnboardingTour startTour={!showSplash} />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,245,249,1)_0%,rgba(248,250,252,0)_75%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(28,37,65,1)_0%,rgba(2,6,23,0)_75%)]"></div>
        <div className="absolute inset-0">
            <div className="absolute top-[-10%] left-[-5%] w-[80vw] h-[80vw] bg-indigo-500/5 rounded-full blur-[160px] animate-blob" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[70vw] h-[70vw] bg-violet-500/5 rounded-full blur-[140px] animate-blob animation-delay-4000" />
        </div>
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(248,250,252,1)_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(2,6,23,1)_100%)]"></div>
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

                  {analysis.error && renderError(analysis.error)}

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
