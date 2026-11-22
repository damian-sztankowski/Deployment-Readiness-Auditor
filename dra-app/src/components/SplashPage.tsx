import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Activity,
  Sparkles,
  BookOpen,
  Cpu,
  Scale,
  GitPullRequest,
  Terminal,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
  onRunDemo: () => void;
  onLearnMore: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({
  onStart,
  onRunDemo,
  onLearnMore
}) => {
  const capabilities = [
    {
      icon: Cpu,
      title: 'Gemini 4 Hydrogen & Carbon',
      detail: '1M-context frontier attack-path synthesis + offline AST fallback',
      accent: 'text-blue-600 dark:text-sky-400'
    },
    {
      icon: Lock,
      title: 'Bidirectional Client DLP',
      detail: 'Secrets scrubbed & identifiers aliased before leaving browser/CLI',
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: Activity,
      title: 'Regional GCP FinOps SKUs',
      detail: 'Deterministic monthly waste, CUDs, & zombie disk cost modeling',
      accent: 'text-amber-600 dark:text-amber-400'
    },
    {
      icon: Scale,
      title: '.dra.yaml Policy & Waivers',
      detail: 'Time-bounded exceptions & required labels attested in CISO PDFs',
      accent: 'text-sky-600 dark:text-cyan-400'
    }
  ];

  const previewPillars = [
    { name: 'Security & Compliance', score: 42, color: 'bg-red-500' },
    { name: 'Cost Optimization', score: 65, color: 'bg-amber-500' },
    { name: 'Reliability & HA', score: 88, color: 'bg-emerald-500' },
    { name: 'Operational Excellence', score: 76, color: 'bg-blue-500' },
    { name: 'Performance Efficiency', score: 95, color: 'bg-emerald-500' }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden bg-[#f5f7fb] dark:bg-[#060a12] text-slate-900 dark:text-slate-100">
      {/* Subtle architectural grid & sapphire ambient radial light */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 left-1/4 w-[760px] h-[520px] bg-blue-600/10 dark:bg-sky-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[620px] h-[440px] bg-emerald-500/8 dark:bg-emerald-500/8 rounded-full blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.045] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Top Minimal Brand Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Logo size="sm" animate={true} />
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              DRA<span className="text-blue-600 dark:text-sky-400">.</span>studio
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-600/10 dark:bg-sky-400/10 text-blue-700 dark:text-sky-300 border border-blue-600/20 dark:border-sky-400/25">
              v3.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLearnMore}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/70 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Documentation
          </button>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity shadow-sm"
          >
            Enter Studio
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Asymmetric Hero Grid */}
      <main className="relative z-10 flex-1 flex items-center w-full max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center w-full">
          {/* Left Column: Core Pitch & CTAs */}
          <div className="lg:col-span-7 space-y-7 animate-enter">
            <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>Powered by</span>
              <span className="font-bold text-blue-600 dark:text-sky-400">
                Gemini 4 Hydrogen
              </span>
              <span className="text-slate-400">•</span>
              <span>CIS GCP v2.0 Deterministic AST</span>
            </div>

            <h1
              id="main-heading"
              tabIndex={-1}
              className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.06]"
            >
              Cloud Deployment Readiness,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 dark:from-sky-400 dark:via-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Engineered for Zero Drift.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Gatekeep <strong>Terraform, OpenTofu, tfplan.json, GKE YAML, and Dockerfiles</strong>{' '}
              in a unified split-pane Command Studio. Combine prompt-injection-immune AST score
              ceilings, regional GCP Billing SKU modeling, and{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-xs text-blue-700 dark:text-sky-300">
                .dra.yaml
              </code>{' '}
              waivers with frontier <strong>Gemini 4</strong> attack-path reasoning.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm sm:text-base font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99]"
              >
                Open Audit Studio
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onRunDemo}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white dark:bg-[#0c1322] hover:bg-slate-50 dark:hover:bg-[#121c31] text-slate-900 dark:text-white rounded-xl text-sm sm:text-base font-bold border border-slate-300 dark:border-slate-700 shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                Interactive Showcase
              </button>

              <button
                type="button"
                onClick={onLearnMore}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                v3.1 Docs &amp; CLI
              </button>
            </div>

            {/* 4-Card Bento Capabilities Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
              {capabilities.map((cap) => (
                <div
                  key={cap.title}
                  className="dra-surface-card p-4 rounded-xl bg-white/90 dark:bg-[#0b111e]/90 border border-slate-200/90 dark:border-slate-800/90 flex items-start gap-3.5 shadow-sm"
                >
                  <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 ${cap.accent} shrink-0`}>
                    <cap.icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                      {cap.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                      {cap.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Live Command Studio Preview Card */}
          <div className="lg:col-span-5 animate-enter">
            <div className="dra-surface-card rounded-2xl bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-slate-100/80 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span className="ml-2 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                    main.tf — Hybrid Gatekeeper
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  DLP: 6 Aliased
                </span>
              </div>

              {/* Gate Telemetry Strip */}
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/25 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                        Gate: Production Blocked
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        2 CIS v2.0 blockers • $124.08/mo reclaimable
                      </div>
                    </div>
                  </div>
                  <span className="tabular-nums text-lg font-black text-red-700 dark:text-red-400 font-mono">
                    72/100
                  </span>
                </div>

                {/* 5-Pillar Mini Bars */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Google Cloud Well-Architected</span>
                    <span className="font-mono text-blue-600 dark:text-sky-400">
                      gemini-4-hydrogen
                    </span>
                  </div>
                  {previewPillars.map((pillar) => (
                    <div key={pillar.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {pillar.name}
                        </span>
                        <span className="tabular-nums font-mono font-bold text-slate-900 dark:text-white">
                          {pillar.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pillar.color}`}
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verified Patch Preview */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                      <GitPullRequest className="w-3.5 h-3.5" aria-hidden="true" />
                      dra-remediation.patch
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      git apply verified
                    </span>
                  </div>
                  <div className="text-slate-400">resource &quot;google_storage_bucket&quot; &quot;data&quot; &#123;</div>
                  <div className="text-red-400 bg-red-950/40 px-1 rounded">
                    - uniform_bucket_level_access = false
                  </div>
                  <div className="text-emerald-400 bg-emerald-950/40 px-1 rounded">
                    + uniform_bucket_level_access = true
                  </div>
                  <div className="text-emerald-400 bg-emerald-950/40 px-1 rounded">
                    + public_access_prevention    = &quot;enforced&quot;
                  </div>
                  <div className="text-slate-400">&#125;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Compact Footer Strip */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>100% Local Asset Bundle • Zero Raw Secret Transmission</span>
        </div>
        <div>Community Open-Source Project (MIT) • Not an official Google product</div>
      </footer>
    </div>
  );
};
