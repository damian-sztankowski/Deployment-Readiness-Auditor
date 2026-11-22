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
  GitPullRequest
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
  const featurePills = [
    {
      icon: Cpu,
      text: 'HYBRID AST + GEMINI 2.5',
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      icon: ShieldCheck,
      text: 'TERRAFORM • OPENTOFU • GKE • DOCKER',
      color: 'text-violet-600 dark:text-violet-400'
    },
    {
      icon: Lock,
      text: 'BIDIRECTIONAL CLIENT-SIDE DLP',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: Activity,
      text: 'REGIONAL GCP FINOPS SKUS',
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      icon: Scale,
      text: '.DRA.YAML POLICY & WAIVERS',
      color: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      icon: GitPullRequest,
      text: 'GIT APPLY UNIFIED DIFFS',
      color: 'text-rose-600 dark:text-rose-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-700">
      {/* Ambient Grid & Glow Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#020617]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(241,245,249,1)_0%,rgba(248,250,252,0)_75%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(28,37,65,1)_0%,rgba(2,6,23,0)_75%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] bg-indigo-600/5 rounded-full blur-[160px] animate-pulse" />
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(248,250,252,1)_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(2,6,23,1)_100%)]" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center space-y-10">
        <div className="flex justify-center mb-6">
          <Logo
            size="xl"
            animate={true}
            className="transform transition-transform duration-1000 scale-110"
          />
        </div>

        <div className="space-y-6 animate-enter">
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-6 py-2 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>DRA v3.0 • Hybrid Deterministic AST + AI Gatekeeper</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black tracking-tighter text-slate-900 dark:text-white leading-[0.88]">
              Deployment Readiness
            </h1>
            <p className="text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem] font-black tracking-tighter bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent leading-[0.9] bg-300% animate-gradient">
              Auditor v3.0
            </p>
          </div>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
            Gatekeep <span className="text-indigo-600 dark:text-indigo-400 font-bold">Terraform, OpenTofu, tfplan.json, GKE YAML &amp; Dockerfiles</span> against the{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Google Cloud Well-Architected Framework</span> with deterministic CIS GCP v2.0 rules, regional FinOps SKU pricing, <code className="text-xs px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono">.dra.yaml</code> waivers, and live Gemini 2.5 attack-path synthesis.
          </p>
        </div>

        {/* CTA Row */}
        <div
          className="animate-enter pt-8 flex flex-col md:flex-row items-center justify-center gap-5"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="relative group w-full md:w-auto">
            <div className="absolute -inset-1.5 bg-indigo-500 rounded-2xl blur-lg opacity-25 group-hover:opacity-45 transition duration-500" />
            <button
              type="button"
              onClick={onStart}
              className="relative w-full md:w-auto flex items-center justify-center gap-4 px-11 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-lg font-black tracking-tight transition-all duration-300 active:scale-95 shadow-2xl border border-indigo-400/20"
            >
              Launch Hybrid Auditor
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRunDemo}
            className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white rounded-2xl text-lg font-black border border-slate-200 dark:border-slate-800 transition-all duration-300 group shadow-lg backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            Interactive Showcase
          </button>

          <button
            type="button"
            onClick={onLearnMore}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl text-xs font-black uppercase tracking-[0.25em] border border-slate-200 dark:border-slate-800 transition-all group"
          >
            <BookOpen className="w-4 h-4 opacity-70 group-hover:opacity-100" aria-hidden="true" />
            v3.0 Docs &amp; Release Notes
          </button>
        </div>

        {/* v3.0 Capability Pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-10 max-w-4xl mx-auto animate-enter"
          style={{ animationDelay: '0.3s' }}
        >
          {featurePills.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/70 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest shadow-sm backdrop-blur-sm"
            >
              <feature.icon className={`w-3.5 h-3.5 ${feature.color}`} aria-hidden="true" />
              {feature.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
