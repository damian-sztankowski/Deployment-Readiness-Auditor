import React, { useState, useEffect } from 'react';
import { Header, ViewType } from './components/Header';
import { InputSection, InputAnalyzeOptions } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { LoadingAnimation } from './components/LoadingAnimation';
import { SplashPage } from './components/SplashPage';
import { About } from './components/About';
import { Features } from './components/Features';
import { InternalDocs } from './components/InternalDocs';
import { CliInfo } from './components/CliInfo';
import { HistorySidebar } from './components/HistorySidebar';
import { OnboardingTour } from './components/OnboardingTour';
import { Footer } from './components/Footer';
import { MOCK_AUDIT_RESULT } from './services/mockData';
import { anonymizeHcl, deanonymizeAuditResult } from './services/dlpService';
import { AnalysisState, AuditResult, AuditStageEvent, HistoryItem } from './types';
import { AlertOctagon, Terminal, RefreshCw, Key, ShieldX, Globe, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('assessment');
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const [inputCode, setInputCode] = useState('');
  const [policyYaml, setPolicyYaml] = useState('');
  const [activeAliasMap, setActiveAliasMap] = useState<Record<string, string>>({});
  const [highlightedLine, setHighlightedLine] = useState<{
    fileName?: string;
    line: number;
  } | null>(null);
  const [comparedItem, setComparedItem] = useState<HistoryItem | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<'gemini' | 'static'>('gemini');

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dra-history');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
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
    stage: null
  });

  useEffect(() => {
    fetch('/api/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((status) => {
        if (status && status.hasGeminiKey === false) {
          setDefaultProvider('static');
        }
      })
      .catch(() => {
        // Ignore offline initial probe
      });
  }, []);

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
    try {
      localStorage.setItem('dra-history', JSON.stringify(history));
    } catch {
      // Ignore quota exceeded
    }
  }, [history]);

  const addToHistory = (result: AuditResult) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).slice(2, 11),
      timestamp: Date.now(),
      summary: result.summary,
      result
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 20));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (comparedItem?.id === id) setComparedItem(null);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setIsDemoMode(false);
    setAnalysis({ isLoading: false, error: null, result: item.result, stage: null });
    setIsInputMinimized(true);
    setCurrentView('assessment');
  };

  const handleRunDemo = async () => {
    setShowSplash(false);
    setIsDemoMode(true);
    setIsInputMinimized(true);
    setCurrentView('assessment');
    setAnalysis({
      isLoading: true,
      error: null,
      result: null,
      stage: { stage: 'static', label: 'Loading Project-Aegis showcase telemetry...', progress: 55 }
    });

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setAnalysis({ isLoading: false, error: null, result: MOCK_AUDIT_RESULT, stage: null });
  };

  const handleJumpToLine = (fileName: string | undefined, line: number) => {
    setIsInputMinimized(false);
    setHighlightedLine({ fileName, line });
    setTimeout(() => {
      document
        .getElementById('input-section-container')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleAnalyze = async (code: string, options?: InputAnalyzeOptions) => {
    setIsDemoMode(false);
    setIsInputMinimized(true);
    setHighlightedLine(null);

    // 1. Bidirectional Client-Side DLP: scrub sensitive identifiers & secrets BEFORE network transmission!
    const clientDlp = anonymizeHcl(code);
    setActiveAliasMap(clientDlp.aliasMap);

    setAnalysis({
      isLoading: true,
      error: null,
      result: null,
      stage: {
        stage: 'dlp',
        label: `Protected ${clientDlp.redactionCount} sensitive field(s) via Client-Side DLP...`,
        progress: 12
      }
    });

    try {
      const response = await fetch('/api/audit/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: clientDlp.sanitizedCode,
          policyYaml: options?.policyYaml,
          llmProvider: options?.provider,
          llmModel: options?.modelName,
          llmUrl: options?.modelUrl
        })
      });

      if (!response.ok || !response.body) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `HTTP ERROR: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalRawResult: AuditResult | null = null;
      let streamError: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const lines = chunk.split('\n');
          let evtType = 'message';
          let dataLine = '';
          for (const l of lines) {
            if (l.startsWith('event:')) evtType = l.slice(6).trim();
            else if (l.startsWith('data:')) dataLine += l.slice(5).trim();
          }
          if (!dataLine) continue;
          const parsed = JSON.parse(dataLine);

          if (evtType === 'stage') {
            setAnalysis((prev) => ({ ...prev, stage: parsed as AuditStageEvent }));
          } else if (evtType === 'result') {
            finalRawResult = parsed as AuditResult;
          } else if (evtType === 'error') {
            streamError = parsed.error || 'Audit stream failed.';
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }
      if (!finalRawResult) {
        throw new Error('SYSTEM_ERROR: Empty response from audit stream.');
      }

      // 2. Restore non-secret semantic aliases locally (`CLOUD_ID_1` -> `finance-prod-12345`)
      const restoredResult = deanonymizeAuditResult(finalRawResult, clientDlp.aliasMap);
      setAnalysis({ isLoading: false, error: null, result: restoredResult, stage: null });
      addToHistory(restoredResult);
    } catch (error: any) {
      setAnalysis({
        isLoading: false,
        error: error.message || 'An unexpected error occurred during analysis.',
        result: null,
        stage: null
      });
      setIsInputMinimized(false);
    }
  };

  const handleStart = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setAnalysis({ isLoading: false, error: null, result: null, stage: null });
      setIsInputMinimized(false);
    }
    setShowSplash(false);
  };

  const renderError = (error: string) => {
    const errorCode = error.split(':')[0] || 'SYSTEM_FAILURE';
    const errorMsg = error.split(':').slice(1).join(':').trim() || error;
    const isConfigError = errorCode === 'CONFIG_ERROR';

    return (
      <div className="max-w-4xl mx-auto mb-16 animate-enter">
        <div className="bg-white dark:bg-[#0a0f1e] rounded-[2.5rem] border border-red-200 dark:border-red-900/40 shadow-3xl overflow-hidden">
          <div className="px-10 py-8 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-[#0a0f1e] border-b border-red-100 dark:border-red-900/30 flex items-center gap-6">
            <div className="p-4 bg-red-600 rounded-3xl shadow-xl shadow-red-500/20">
              <AlertOctagon className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Audit Engine Halted
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-[0.2em]">
                  {errorCode}
                </span>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-5">
              <ShieldX className="w-6 h-6 text-red-500 opacity-60 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {isConfigError && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                <div className="flex items-center gap-3 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <Cpu className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  <span>
                    No Gemini API_KEY configured? Run DRA's zero-key Deterministic AST Engine instead!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyze(inputCode, { provider: 'static', policyYaml })}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Run Offline AST Audit
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                  Secret Manager Injection
                </h4>
                <pre className="text-[10px] font-mono bg-slate-900 p-3 rounded-lg text-emerald-400 overflow-x-auto border border-slate-800">
                  <code>gcloud run services update ... --set-secrets API_KEY=dra-gemini-key:latest</code>
                </pre>
              </div>

              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" aria-hidden="true" />
                  Credential Access
                </h4>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-slate-500">
                    Verify your Gemini API key in{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-500 underline font-bold"
                    >
                      Google AI Studio
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setAnalysis({ ...analysis, error: null })}
                className="flex items-center gap-3 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-xl shadow-red-500/20 text-[10px] uppercase tracking-widest"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Dismiss &amp; Edit
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
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,245,249,1)_0%,rgba(248,250,252,0)_75%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(28,37,65,1)_0%,rgba(2,6,23,0)_75%)]" />
      </div>

      <div className="relative z-10 flex flex-col flex-grow w-full">
        {showSplash ? (
          <SplashPage
            onStart={handleStart}
            onRunDemo={handleRunDemo}
            onLearnMore={() => {
              setShowSplash(false);
              setCurrentView('docs');
            }}
          />
        ) : (
          <>
            <Header
              currentView={currentView}
              onNavigate={setCurrentView}
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
              comparedId={comparedItem?.id || null}
              onCompare={(item) => setComparedItem(item)}
            />

            <main className="flex-1 w-full max-w-[2200px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24 py-12 md:py-16">
              {currentView === 'about' && (
                <About onStartAssessment={() => setCurrentView('assessment')} />
              )}
              {currentView === 'features' && <Features />}
              {currentView === 'docs' && (
                <InternalDocs onStartAssessment={() => setCurrentView('assessment')} />
              )}
              {currentView === 'cli' && <CliInfo />}

              <div className={currentView === 'assessment' ? 'block animate-enter' : 'hidden'}>
                {isDemoMode && (
                  <div className="max-w-5xl mx-auto mb-8 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between text-indigo-600 dark:text-indigo-400 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-sm font-black uppercase tracking-widest">
                        Interactive Showcase Mode Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDemoMode(false);
                        setAnalysis({ isLoading: false, error: null, result: null, stage: null });
                        setIsInputMinimized(false);
                      }}
                      className="text-xs font-bold underline underline-offset-4 hover:text-indigo-800"
                    >
                      Exit Showcase &amp; Run Live Audit
                    </button>
                  </div>
                )}

                {!analysis.result && !analysis.isLoading && (
                  <div className="max-w-5xl mx-auto mb-16 text-center">
                    <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.85]">
                      Architect with
                      <br />
                      <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent inline-block pb-2">
                        Confidence.
                      </span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto font-medium">
                      Hybrid deterministic AST + AI readiness gatekeeper for{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        Google Cloud Terraform, OpenTofu &amp; GKE
                      </span>
                      .
                    </p>
                  </div>
                )}

                <div className="mb-16 transition-all duration-700 ease-in-out">
                  <InputSection
                    code={inputCode}
                    onCodeChange={setInputCode}
                    policyYaml={policyYaml}
                    onPolicyChange={setPolicyYaml}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={analysis.isLoading}
                    minimized={isInputMinimized}
                    onToggleMinimize={() => setIsInputMinimized(!isInputMinimized)}
                    onRunDemo={handleRunDemo}
                    highlightedLine={highlightedLine}
                    defaultProvider={defaultProvider}
                  />
                </div>

                {analysis.isLoading && (
                  <div className="mb-12">
                    <LoadingAnimation stageEvent={analysis.stage} />
                  </div>
                )}

                {analysis.error && renderError(analysis.error)}

                {analysis.result && (
                  <div className="mb-24 mt-16">
                    <Dashboard
                      result={analysis.result}
                      isDemo={isDemoMode}
                      originalCode={inputCode}
                      aliasMap={activeAliasMap}
                      comparedBaseline={comparedItem}
                      onClearComparison={() => setComparedItem(null)}
                      onJumpToLine={handleJumpToLine}
                    />
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
