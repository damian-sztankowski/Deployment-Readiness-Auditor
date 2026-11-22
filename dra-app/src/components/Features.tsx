import React from 'react';
import {
  Shield,
  Sparkles,
  Zap,
  FileText,
  Compass,
  CheckCircle,
  Fingerprint,
  AlertOctagon,
  GitBranch,
  Network,
  FileCheck,
  Cpu,
  Terminal,
  Scale,
  Bot,
  GitCompare,
  Layers
} from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      title: 'Hybrid Deterministic AST + Gemini 4',
      description:
        'Pairs prompt-injection-immune HCL/YAML/Docker AST static rules (exact line ranges & variable interpolation) with Gemini 4 Hydrogen & Carbon cross-resource attack-path synthesis—plus a zero-key Offline AST Mode.',
      icon: Cpu,
      color: 'text-blue-600 dark:text-sky-400',
      bg: 'bg-blue-50 dark:bg-sky-900/20'
    },
    {
      title: 'Multi-Stack IaC Coverage',
      description:
        'Audits Terraform (.tf, .tfvars), OpenTofu (.tofu), compiled execution plans (tfplan.json), Kubernetes/GKE manifests (.yaml), and container Dockerfiles in one unified gate.',
      icon: Layers,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20'
    },
    {
      title: 'Bidirectional Client-Side DLP',
      description:
        'Permanently scrubs secrets (AIzaSy..., PEM keys, tokens) and aliases project/VPC/email identifiers in the browser or CLI before transmission, restoring non-secret names locally.',
      icon: Fingerprint,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      title: 'Side-by-Side Diff & Verified Git Patches',
      description:
        'Inspect Before vs. After HCL remediations visually and export POSIX unified patches (dra-remediation.patch) verified against git apply --check, plus click-to-jump editor lines.',
      icon: GitBranch,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      title: 'Regional GCP Cloud Billing SKU Engine',
      description:
        'Calculates provisioned monthly baseline spend vs. optimized spend using regional GCP SKU multipliers (us-central1, europe-west3, etc.), count scaling, CUDs, and zombie disk detection.',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      title: '.dra.yaml Org Policy & Expiring Waivers',
      description:
        'Enforce mandatory FinOps labels, EU/US data-residency regions, banned machine families, and time-bounded security waivers attested directly in the CISO PDF Brief.',
      icon: Scale,
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
      title: 'Principal Cloud Architect Co-Pilot',
      description:
        'Ask interactive remediation questions grounded in any finding—such as zero-downtime Terraform state moves, Private Service Connect refactors, or IAM least-privilege bindings.',
      icon: Bot,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Executive Verdict & Compliance Matrix',
      description:
        'Immediate Go/No-Go verdicts (BLOCKED, CONDITIONAL, READY), maturity grades (A+ to F), and searchable control mapping across CIS GCP v2.0, NIST 800-53, GDPR, HIPAA, PCI DSS, and SOC 2.',
      icon: AlertOctagon,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
      title: 'Boardroom CISO Multi-Page PDF Brief',
      description:
        'Generates a dark-cover executive PDF instrument with KPI scorecards, compliance matrices, FinOps SKU tables, HCL fixes, accepted risk waivers, and 3-party sign-off blocks.',
      icon: FileText,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20'
    },
    {
      title: 'Strict Sanitized Topology Map',
      description:
        'Renders interactive Mermaid dependency and blast-radius graphs in strict security mode with DOMParser SVG allowlist sanitization, zoom/pan controls, and native modal fullscreen.',
      icon: Network,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Historical Drift & Score Deltas',
      description:
        'Pin any previous local audit scan as a comparison baseline to track maturity score gains (+pts), resolved critical blockers, and newly introduced infrastructure drift.',
      icon: GitCompare,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'dra-cli v3.0 & Sticky GitHub PR Bot',
      description:
        'Go CLI with --changed-only Git PR delta scanning, NO_COLOR/TTY awareness, 429 Retry-After backoff, SARIF 2.1.0 GitHub Security uploads, and --output github-pr sticky PR comments.',
      icon: Terminal,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <div className="animate-enter space-y-28 py-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600 dark:text-sky-400">
          DRA v3.1 Platform Capabilities
        </p>
        <h1
          id="main-heading"
          tabIndex={-1}
          className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
        >
          Hybrid AST + Gemini 4 Gatekeeper
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          DRA v3.1 unites{' '}
          <span className="text-blue-600 dark:text-sky-400 font-bold">
            deterministic CIS GCP v2.0 AST verification
          </span>{' '}
          with Gemini 4 Hydrogen &amp; Carbon cross-resource reasoning, regional FinOps SKU modeling, and enterprise policy governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featureList.map((f, i) => (
          <div
            key={i}
            className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-500"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
            >
              <f.icon className="w-7 h-7" aria-hidden="true" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">{f.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Real-Time SSE Streaming Pipeline
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
              The 5-Stage Hybrid Audit Pipeline
            </h3>
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Bidirectional Client-Side DLP',
                  desc: 'Browser & CLI scrub high-entropy secrets permanently and map project IDs, VPCs, and emails to reversible semantic aliases before transmission.'
                },
                {
                  step: '02',
                  title: 'Deterministic Multi-Stack AST Pass',
                  desc: 'Evaluates HCL (resolving variables.tf & .tfvars), tfplan.json, K8s YAML, and Dockerfiles for exact line numbers and CIS GCP v2.0 score ceilings.'
                },
                {
                  step: '03',
                  title: 'Regional GCP Billing SKU Calculation',
                  desc: 'Computes monthly provisioned vs. optimized spend across GCP regions, count multipliers, CUDs, and idle block storage.'
                },
                {
                  step: '04',
                  title: '.dra.yaml Policy & Waiver Governance',
                  desc: 'Enforces required labels, data-residency regions, and banned machine families while separating valid unexpired waivers for CISO attestation.'
                },
                {
                  step: '05',
                  title: 'AI Attack-Path Synthesis & Verified Diffs',
                  desc: 'Gemini 4 Hydrogen / Carbon (or local Ollama/LM Studio) synthesizes multi-hop risks and Mermaid diagrams, then restores local aliases and builds git apply patches.'
                }
              ].map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <span className="text-lg font-black text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity">
                    {s.step}
                  </span>
                  <div>
                    <h5 className="font-bold text-lg mb-1.5">{s.title}</h5>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 hidden lg:flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse" />
              <Shield className="w-full h-full text-indigo-500/20 animate-morph" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle
                  className="w-24 h-24 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
