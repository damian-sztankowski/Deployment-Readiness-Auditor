import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { CommandRail, Header, ViewType } from './components/Header';
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
import {
  AnalysisState,
  AuditResult,
  AuditStageEvent,
  AuditWorkspaceMode,
  GEMINI_MODEL,
  HistoryItem
} from './types';
import { AlertOctagon, Terminal, RefreshCw, Key, ShieldX, Globe, Cpu } from 'lucide-react';

const DEMO_SHOWCASE_HCL = `### FILE: main.tf ###
resource "google_storage_bucket" "corporate_data" {
  name                        = "corp-data-prod"
  location                    = "US"
  uniform_bucket_level_access = false
}

resource "google_compute_instance" "admin_box" {
  name         = "admin-box"
  machine_type = "n1-standard-4"
  zone         = "us-central1-a"
}

resource "google_compute_firewall" "allow_all_ingress" {
  name    = "allow-all-ingress"
  network = "prod-secure-vpc"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# Missing environment, owner, and cost_center labels above (Ln 26)

resource "google_compute_disk" "unused_disk_backup" {
  name = "unused-disk-backup"
  type = "pd-ssd"
  zone = "us-central1-a"
  size = 500
}
`;

const VIEW_TITLES: Record<ViewType, string> = {
  assessment: 'Audit Studio — DRA v3.1',
  about: 'Overview & Zero-Knowledge DLP — DRA v3.1',
  features: 'Platform Capabilities — DRA v3.1',
  docs: 'Technical Manual & Releases — DRA v3.1',
  cli: 'CLI & CI/CD Quality Gates — DRA v3.1'
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('assessment');
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<AuditWorkspaceMode>('split');
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
  const [previewModel, setPreviewModel] = useState<string>(GEMINI_MODEL);

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

  // Same-Document SPA View Transition helper with mandatory post-navigation focus management
  const runTransition = useCallback((mutate: () => void, moveFocusToHeading = false) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const focusHeading = () => {
      if (!moveFocusToHeading) return;
      requestAnimationFrame(() => {
        document.getElementById('main-heading')?.focus({ preventScroll: true });
      });
    };

    if (typeof doc.startViewTransition === 'function') {
      try {
        const vt = doc.startViewTransition(() => {
          flushSync(mutate);
        });
        vt.finished.finally(focusHeading);
        return;
      } catch {
        // Fallback when document is hidden or unsupported
      }
    }
    mutate();
    focusHeading();
  }, []);

  const handleNavigate = useCallback(
    (nextView: ViewType) => {
      if (nextView === currentView) return;
      runTransition(() => {
        setCurrentView(nextView);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }, true);
    },
    [currentView, runTransition]
  );

  const handleWorkspaceModeChange = useCallback(
    (nextMode: AuditWorkspaceMode) => {
      runTransition(() => {
        setWorkspaceMode(nextMode);
      }, false);
    },
    [runTransition]
  );

  useEffect(() => {
    document.title = showSplash
      ? 'DRA v3.1 — Cloud Deployment Readiness Studio'
      : VIEW_TITLES[currentView];
  }, [showSplash, currentView]);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((status) => {
        if (status && status.hasGeminiKey === false) {
          setDefaultProvider('static');
          setPreviewModel('dra-deterministic-ast-v3');
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
    runTransition(() => {
      setIsDemoMode(false);
      setAnalysis({ isLoading: false, error: null, result: item.result, stage: null });
      setIsInputMinimized(true);
      setWorkspaceMode('overview');
      setCurrentView('assessment');
    }, true);
  };

  const handleRunDemo = async () => {
    runTransition(() => {
      setShowSplash(false);
      setIsDemoMode(true);
      if (!inputCode.trim()) {
        setInputCode(DEMO_SHOWCASE_HCL);
      }
      setIsInputMinimized(true);
      setWorkspaceMode('overview');
      setCurrentView('assessment');
      setAnalysis({
        isLoading: true,
        error: null,
        result: null,
        stage: {
          stage: 'static',
          label: 'Loading Project-Aegis hybrid showcase telemetry...',
          progress: 55
        }
      });
    }, true);

    await new Promise((resolve) => setTimeout(resolve, 900));
    setAnalysis({ isLoading: false, error: null, result: MOCK_AUDIT_RESULT, stage: null });
  };

  const handleJumpToLine = (fileName: string | undefined, line: number) => {
    setIsInputMinimized(false);
    setHighlightedLine({ fileName, line });
    if (workspaceMode !== 'split') {
      setWorkspaceMode('split');
    }
    setTimeout(() => {
      document
        .getElementById('input-section-container')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleAnalyze = async (code: string, options?: InputAnalyzeOptions) => {
    setIsDemoMode(false);
    setIsInputMinimized(true);
    setHighlightedLine(null);

    // 1. Bidirectional Client-Side DLP: scrub sensitive identifiers & secrets BEFORE network transmission
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
    runTransition(() => {
      if (isDemoMode) {
        setIsDemoMode(false);
        setAnalysis({ isLoading: false, error: null, result: null, stage: null });
        setIsInputMinimized(false);
      }
      setShowSplash(false);
      setCurrentView('assessment');
    }, true);
  };

  const renderError = (error: string) => {
    const errorCode = error.split(':')[0] || 'SYSTEM_FAILURE';
    const errorMsg = error.split(':').slice(1).join(':').trim() || error;
    const isConfigError = errorCode === 'CONFIG_ERROR';

    return (
      <div className="max-w-4xl mx-auto mb-10 animate-enter">
        <div className="dra-surface-card bg-white dark:bg-[#0b111e] rounded-2xl border border-red-300 dark:border-red-900/50 shadow-xl overflow-hidden">
          <div className="px-6 sm:px-8 py-5 bg-red-50/80 dark:bg-red-950/25 border-b border-red-200 dark:border-red-900/40 flex items-center gap-4">
            <div className="p-3 bg-red-600 rounded-xl shadow-sm">
              <AlertOctagon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Audit Engine Halted
              </h3>
              <span className="text-red-700 dark:text-red-400 font-mono font-bold text-xs uppercase tracking-wider">
                {errorCode}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-3.5">
              <ShieldX className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {isConfigError && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-900/50">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>
                    No Gemini API_KEY configured? Run DRA&apos;s zero-key Deterministic AST Engine instead.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyze(inputCode, { provider: 'static', policyYaml })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Run Offline AST Audit
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                  Cloud Run Secret Manager Injection
                </h4>
                <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-lg text-emerald-400 overflow-x-auto border border-slate-800">
                  <code>gcloud run services update ... --set-secrets API_KEY=dra-gemini-key:latest</code>
                </pre>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                  Gemini 4 API Key Provisioning
                </h4>
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Create or verify your Gemini API key in{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-sky-400 underline font-bold"
                    >
                      Google AI Studio
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setAnalysis({ ...analysis, error: null })}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Dismiss &amp; Return to Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const activeEngineForHeader = analysis.result?.model || previewModel;
  const isSplitActiveWithResult = Boolean(analysis.result && workspaceMode === 'split');

  return (
    <div className="flex-1 flex flex-col w-full bg-[#f5f7fb] dark:bg-[#060a12] relative font-sans text-slate-900 dark:text-slate-100">
      {/* Mandatory Keyboard Skip Link (first focusable node in DOM) */}
      <a href="#main-heading" className="visually-hidden skip-link">
        Skip to main content
      </a>

      <OnboardingTour startTour={!showSplash} />

      {showSplash ? (
        <SplashPage
          onStart={handleStart}
          onRunDemo={handleRunDemo}
          onLearnMore={() => {
            runTransition(() => {
              setShowSplash(false);
              setCurrentView('docs');
            }, true);
          }}
        />
      ) : (
        <div className="flex min-h-screen w-full">
          {/* Desktop Collapsible Left Command Rail */}
          <CommandRail
            currentView={currentView}
            onNavigate={handleNavigate}
            collapsed={railCollapsed}
            onToggleCollapse={() => setRailCollapsed((c) => !c)}
            onBackToSplash={() =>
              runTransition(() => {
                setShowSplash(true);
              }, true)
            }
          />

          {/* Right Workspace Column */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header
              currentView={currentView}
              onNavigate={handleNavigate}
              isDarkMode={isDarkMode}
              toggleTheme={() => setIsDarkMode(!isDarkMode)}
              onToggleHistory={() => setShowHistory(true)}
              historyCount={history.length}
              activeModel={activeEngineForHeader}
              onRunDemo={handleRunDemo}
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

            <main
              id="main-workspace"
              className="flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8"
            >
              {currentView === 'about' && (
                <About onStartAssessment={() => handleNavigate('assessment')} />
              )}
              {currentView === 'features' && <Features />}
              {currentView === 'docs' && (
                <InternalDocs onStartAssessment={() => handleNavigate('assessment')} />
              )}
              {currentView === 'cli' && <CliInfo />}

              {currentView === 'assessment' && (
                <div className="space-y-6 animate-enter">
                  {/* Compact Studio Page Header (replaces giant text-9xl banner so editor stays above the fold!) */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <h1
                        id="main-heading"
                        tabIndex={-1}
                        className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
                      >
                        Hybrid Audit Studio
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Deterministic CIS GCP v2.0 AST + regional FinOps SKU calculator +{' '}
                        <strong className="text-blue-700 dark:text-sky-300">
                          Gemini 4 Hydrogen
                        </strong>{' '}
                        attack-path synthesis.
                      </p>
                    </div>

                    {isDemoMode && (
                      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-600/10 dark:bg-sky-400/10 border border-blue-600/25 dark:border-sky-400/30 text-xs font-bold text-blue-800 dark:text-sky-300">
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 animate-ping" aria-hidden="true" />
                        <span>Project-Aegis Showcase Active</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDemoMode(false);
                            setAnalysis({ isLoading: false, error: null, result: null, stage: null });
                            setIsInputMinimized(false);
                          }}
                          className="underline hover:opacity-80 ml-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Standalone Editor (shown before audit runs, or as minimized bar in non-Split views) */}
                  {!isSplitActiveWithResult && (
                    <InputSection
                      code={inputCode}
                      onCodeChange={setInputCode}
                      policyYaml={policyYaml}
                      onPolicyChange={setPolicyYaml}
                      onAnalyze={handleAnalyze}
                      isAnalyzing={analysis.isLoading}
                      minimized={isInputMinimized && Boolean(analysis.result)}
                      onToggleMinimize={() => setIsInputMinimized(!isInputMinimized)}
                      onRunDemo={handleRunDemo}
                      highlightedLine={highlightedLine}
                      defaultProvider={defaultProvider}
                      onModelPreviewChange={setPreviewModel}
                    />
                  )}

                  {analysis.isLoading && (
                    <div className="py-4">
                      <LoadingAnimation stageEvent={analysis.stage} />
                    </div>
                  )}

                  {analysis.error && renderError(analysis.error)}

                  {analysis.result && (
                    <Dashboard
                      result={analysis.result}
                      isDemo={isDemoMode}
                      originalCode={inputCode}
                      aliasMap={activeAliasMap}
                      comparedBaseline={comparedItem}
                      onClearComparison={() => setComparedItem(null)}
                      onJumpToLine={handleJumpToLine}
                      workspaceMode={workspaceMode}
                      onWorkspaceModeChange={handleWorkspaceModeChange}
                      editorSlot={
                        workspaceMode === 'split' ? (
                          <InputSection
                            code={inputCode}
                            onCodeChange={setInputCode}
                            policyYaml={policyYaml}
                            onPolicyChange={setPolicyYaml}
                            onAnalyze={handleAnalyze}
                            isAnalyzing={analysis.isLoading}
                            minimized={false}
                            onRunDemo={handleRunDemo}
                            highlightedLine={highlightedLine}
                            defaultProvider={defaultProvider}
                            compact={true}
                            onModelPreviewChange={setPreviewModel}
                          />
                        ) : undefined
                      }
                    />
                  )}
                </div>
              )}
            </main>

            <Footer lastResult={analysis.result} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
