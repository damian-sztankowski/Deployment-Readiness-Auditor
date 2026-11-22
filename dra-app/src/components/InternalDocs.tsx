import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Terminal,
  Sparkles,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Activity,
  Tag,
  ShieldAlert,
  Scale
} from 'lucide-react';
import { DiagramView } from './DiagramView';

interface InternalDocsProps {
  onStartAssessment: () => void;
}

const ARCHITECTURE_MERMAID = `flowchart TD
    subgraph S_Inputs["Layer 1: Multi-Stack IaC & Policy"]
        TF["Terraform / OpenTofu (.tf, .tofu, tfplan.json)"]
        K8S["GKE / K8s YAML & Dockerfiles"]
        POL[".dra.yaml Org Policy & Expiring Waivers"]
    end

    subgraph S_Client["Layer 2: Client Interfaces (Bidirectional DLP)"]
        WEB["Offline-Ready Vite + React 19 Web UI"]
        CLI["dra-cli v3.0 (Git Delta & TTY Aware)"]
    end

    subgraph S_Backend["Layer 3: Hardened Cloud Run v2 Backend"]
        SEC["OIDC / Constant-Time Auth & Proxy Rate Limiter"]
        AST["Deterministic AST & CIS GCP v2.0 Engine"]
        FIN["Regional GCP Cloud Billing SKU Calculator"]
        AI["Gemini 4 Hydrogen & Carbon / Local Ollama"]
    end

    subgraph S_Outputs["Layer 4: Governance & Developer Action"]
        DIFF["Side-by-Side Diff & Verified git apply .patch"]
        PR["Sticky GitHub PR Bot & SARIF 2.1.0"]
        PDF["CISO PDF Brief + Waiver Attestation"]
        CHAT["Principal Cloud Architect Co-Pilot"]
    end

    TF --> WEB
    K8S --> WEB
    POL --> WEB
    TF --> CLI
    POL --> CLI

    WEB -->|SSE /api/audit/stream| SEC
    CLI -->|POST /api/audit| SEC
    SEC --> AST
    AST --> FIN
    FIN --> AI

    AI --> DIFF
    AI --> PR
    AI --> PDF
    AI --> CHAT`;

export const InternalDocs: React.FC<InternalDocsProps> = ({ onStartAssessment }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'architecture' | 'models' | 'cicd' | 'releases'
  >('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="animate-enter space-y-16 py-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-sky-400/25 text-sky-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            DRA v3.1 Engineering Reference &amp; Release History
          </div>
          <h1
            id="main-heading"
            tabIndex={-1}
            className="text-4xl md:text-6xl font-black tracking-tighter"
          >
            DRA v3.1 Technical Manual <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-emerald-400 bg-clip-text text-transparent">
              &amp; Release Notes
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
            Hybrid AST + AI pipeline specifications, Bidirectional Client-Side DLP,{' '}
            <code className="text-indigo-300">.dra.yaml</code> policy governance, Cloud Run v2 Terraform self-hosting, and full release changelog.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="button"
              onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              Launch Audit Engine
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <a
              href="https://github.com/damian-sztankowski/Deployment-Readiness-Auditor"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-700 transition-all"
            >
              GitHub Repository
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', label: 'System Overview', icon: Sparkles },
          { id: 'architecture', label: 'Architecture & Security', icon: Layers },
          { id: 'models', label: 'Hybrid & LLM Engines', icon: Cpu },
          { id: 'cicd', label: 'CI/CD, PR Bot & IaC', icon: Terminal },
          { id: 'releases', label: 'Release Notes (v3.1.0)', icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-12 animate-enter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                <Shield className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Hybrid AST + AI Scoring
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Combines deterministic CIS GCP v2.0 AST checks (with variable interpolation and hard score ceilings) alongside Gemini 4 Hydrogen &amp; Carbon cross-resource attack-path reasoning.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                <Scale className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                .dra.yaml Policy &amp; Waivers
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Enforce required labels, approved GCP data-residency regions, banned legacy VM families, and time-bounded waivers attested in the CISO PDF Brief.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Regional GCP Billing SKUs
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Calculates monthly baseline spend vs. optimized spend across regional multipliers (<code>us-central1</code>, <code>europe-west3</code>, etc.), <code>count</code> scaling, and CUDs.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Supported Multi-Stack Input Formats (v3.0)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  badge: '*.tf, *.tofu, *.tfvars',
                  title: 'Terraform & OpenTofu',
                  desc: 'Brace-balanced HCL block parsing with variable defaults and .tfvars interpolation.'
                },
                {
                  badge: 'tfplan.json',
                  title: 'Terraform Plan JSON',
                  desc: 'Evaluates planned resource mutations (change.after) generated via terraform show -json.'
                },
                {
                  badge: '*.yaml, Dockerfile',
                  title: 'GKE / K8s & Containers',
                  desc: 'Flags privileged pods, missing CPU/memory limits, and root container execution.'
                },
                {
                  badge: '.dra.yaml',
                  title: 'Org Policy & Waivers',
                  desc: 'Defines custom organization guardrails, pillar weights, and expiring security exceptions.'
                }
              ].map((fmt, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2.5"
                >
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-block">
                    {fmt.badge}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{fmt.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {fmt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARCHITECTURE & SECURITY */}
      {activeTab === 'architecture' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
                v3.0 Hybrid Topology
              </span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                End-to-End Hybrid System Architecture
              </h3>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950/40">
              <DiagramView code={ARCHITECTURE_MERMAID} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Prompt-Injection &amp; SSRF Hardening
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Untrusted IaC payloads are isolated inside randomized XML boundary tags and bounded by deterministic AST score ceilings so malicious HCL comments can never force a 100/Safe score. Outbound custom LLM URLs validate against Node&apos;s <code>net.BlockList</code> (IPv4/IPv6 ULA, CGNAT, <code>169.254.169.254</code>) with <code>redirect: &apos;error&apos;</code>.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  OIDC Auth, __Host- Sessions &amp; Strict SVG
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Verifies Google OIDC tokens via <code>google-auth-library</code>, compares API keys in constant time via SHA-256 <code>timingSafeEqual</code>, enforces <code>__Host-dra_session</code> cookies + <code>Sec-Fetch-Site</code> isolation, and sanitizes Mermaid SVGs via <code>DOMParser</code> in <code>strict</code> mode.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HYBRID & LLM MODEL CONFIGURATION */}
      {activeTab === 'models' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-indigo-500" aria-hidden="true" />
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Supported Intelligence Engines (v3.1)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Run Gemini 4 frontier models, Gemini 3.8 Flash, 100% zero-key deterministic AST, or local air-gapped LLMs.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Provider / Model ID</th>
                    <th className="p-4">Recommended Use Case</th>
                    <th className="p-4">Latency &amp; Cost</th>
                    <th className="p-4">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-sky-400">
                      gemini-4-hydrogen
                    </td>
                    <td className="p-4">
                      Fastest Gemini 4 frontier model (1M context) for agentic IaC audits &amp; rapid CI/CD quality gates
                    </td>
                    <td className="p-4">Sub-second TTFT / Optimal cost</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                        Default
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-sky-600 dark:text-cyan-400">
                      gemini-4-carbon
                    </td>
                    <td className="p-4">
                      Deep frontier security reasoning for multi-module attack paths &amp; Principal Architect Co-Pilot
                    </td>
                    <td className="p-4">Maximum frontier reasoning depth</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-sky-400 text-[10px] font-black uppercase">
                        Deep Frontier
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      gemini-4-neon / gemini-4-argon
                    </td>
                    <td className="p-4">
                      Multi-module Terraform exploration (Neon) &amp; sparse MoE monorepo compliance audits (Argon)
                    </td>
                    <td className="p-4">High throughput / Low token overhead</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase">
                        Gemini 4
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      gemini-3.8-flash / gemini-3.1-pro-preview
                    </td>
                    <td className="p-4">
                      Stable Gemini 3.x alternatives for existing enterprise pinned pipelines
                    </td>
                    <td className="p-4">Balanced speed &amp; stability</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">
                        3.x Series
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      static (dra-deterministic-ast-v3)
                    </td>
                    <td className="p-4">
                      Instant CIS GCP v2.0 + Regional FinOps + .dra.yaml policy scan without any API key
                    </td>
                    <td className="p-4">&lt;50ms / $0.00 cost / Zero LLM</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-500 text-[10px] font-black uppercase">
                        Zero-Key
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ollama / lm-studio (gemma4:e2b)
                    </td>
                    <td className="p-4">
                      Air-gapped local developer workstations (Vite bundle loads 100% offline)
                    </td>
                    <td className="p-4">Zero outbound traffic / Self-hosted</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">
                        Air-Gapped
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CI/CD, PR BOT & TERRAFORM IAC */}
      {activeTab === 'cicd' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
                DevSecOps Automation
              </span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                dra-cli v3.0 Gates, Sticky PR Bot &amp; Cloud Run v2 Terraform
              </h3>
            </div>

            <div className="relative">
              <pre
                role="region"
                aria-label="DRA CLI v3.0 CI/CD quality gate examples"
                tabIndex={0}
                className="text-xs font-mono bg-slate-950 p-5 rounded-2xl text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed"
              >
                <code>{`# 1. PR Delta Mode: scan only Git-modified IaC files relative to production
./dra-cli/bin/dra-cli scan --path . --changed-only --base origin/production --fail-on critical,high

# 2. Enforce .dra.yaml Org Policy & Waivers + minimum pillar score (75/100)
./dra-cli/bin/dra-cli scan --path ./infra/terraform --policy .dra.yaml --min-score 75 --no-color

# 3. Generate Sticky GitHub PR Comment (with Mermaid topology & HCL suggestions) + SARIF 2.1.0
./dra-cli/bin/dra-cli scan --path . --output github-pr --output-file dra-pr-comment.md
./dra-cli/bin/dra-cli scan --path . --output sarif --output-file dra-results.sarif

# 4. Generate & verify POSIX unified Git remediation patch
./dra-cli/bin/dra-cli scan --path ./terraform --fix-patch dra-remediation.patch
git apply --check dra-remediation.patch && git apply dra-remediation.patch`}</code>
              </pre>
              <button
                type="button"
                aria-label="Copy CI/CD commands"
                onClick={() =>
                  copyToClipboard(
                    './dra-cli/bin/dra-cli scan --path . --changed-only --base origin/production --fail-on critical,high',
                    'cicd1'
                  )
                }
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copiedSnippet === 'cicd1' ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Self-Hosted Cloud Run v2 Terraform Stack (<code>infra/terraform/</code>)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deploy DRA itself with Secret Manager secret mounts, dedicated least-privilege IAM, and keyless GitHub Actions Workload Identity Federation:
              </p>
              <pre
                role="region"
                aria-label="Terraform Cloud Run deployment commands"
                tabIndex={0}
                className="text-xs font-mono bg-slate-950 p-5 rounded-2xl text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed"
              >
                <code>{`cd infra/terraform
terraform init
terraform apply \\
  -var="project_id=deployment-readiness-auditor" \\
  -var="service_name=dra-v3" \\
  -var="container_image=us-central1-docker.pkg.dev/deployment-readiness-auditor/dra/dra-app:v3.0.0"`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RELEASE NOTES */}
      {activeTab === 'releases' && (
        <div className="space-y-12 animate-enter">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 md:p-10 space-y-10">
            {/* v3.1.0 */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-700 dark:text-sky-300 text-xs font-black uppercase tracking-widest">
                    v3.1.0 Studio &amp; Gemini 4 Release
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">November 2026</span>
                </div>
                <span className="px-3 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  Current Release
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Gemini 4 Frontier Model Suite (gemini-4-hydrogen Default)',
                    desc: 'Upgraded default AI engine from legacy gemini-2.5-flash to Gemini 4 Hydrogen, with built-in presets for Gemini 4 Carbon, Neon, Argon, and Gemini 3.8 Flash—automatically omitting deprecated sampling parameters on 4.x/3.8 APIs.'
                  },
                  {
                    title: 'Command Studio Shell & Collapsible Navigation Rail',
                    desc: 'Redesigned application shell with a collapsible desktop Command Rail, native HTML popover mobile drawer, asymmetric live-telemetry splash hero, and SPA Same-Document View Transitions.'
                  },
                  {
                    title: '5-Mode Audit Workbench (Side-by-Side Split View)',
                    desc: 'Added Split Workbench (side-by-side IaC editor + live findings with zero-scroll Jump-to-Line), Executive Overview, Topology Canvas, FinOps & Compliance, and Full Report tabs.'
                  },
                  {
                    title: 'Perceptual OKLCH Sapphire Palette & Forced-Colors Accessibility',
                    desc: 'Replaced rainbow pink/purple borders with crisp OKLCH Sapphire & Obsidian surfaces, tabular numerals, skip-to-content navigation, :focus-visible rings, and Windows High Contrast support.'
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0"
                        aria-hidden="true"
                      />
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* v3.0.0 */}
            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
                    v3.0.0 Major Release
                  </span>
                  <span className="text-xs font-bold text-slate-400">November 2026</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Hybrid Deterministic AST + AI Engine',
                    desc: 'Added brace-balanced HCL/OpenTofu, tfplan.json, K8s YAML, and Dockerfile static rules with variable/.tfvars interpolation, prompt-injection score ceilings, and zero-key Offline AST Mode.'
                  },
                  {
                    title: 'Bidirectional Client-Side DLP (Web + CLI)',
                    desc: 'Sensitive project/VPC/email identifiers are aliased locally before transmission and restored locally in fixes and diagrams while secrets remain permanently scrubbed.'
                  },
                  {
                    title: 'Side-by-Side Diff Viewer & Verified Git Patches',
                    desc: 'Replaced synthetic hunks with real POSIX unified diffs verified by git apply --check, plus synchronized line-numbered Jump-to-Line code editor.'
                  },
                  {
                    title: 'Regional GCP Cloud Billing SKU Calculator',
                    desc: 'Deterministic monthly baseline vs. optimized spend across regional multipliers, count scaling, CUDs, external IPv4 fees, and unattached disks.'
                  },
                  {
                    title: '.dra.yaml Org Policies & Time-Bounded Waivers',
                    desc: 'Enforces requiredLabels, allowedRegions, bannedMachinePrefixes, customRules, and expiring risk waivers attested in the CISO PDF Brief.'
                  },
                  {
                    title: 'Real-Time SSE Streaming & Principal Architect Co-Pilot',
                    desc: 'Live /api/audit/stream progress stages, interactive Principal Architect chat modal, and Historical Drift baseline score comparison.'
                  },
                  {
                    title: '100% Offline Vite + Tailwind Bundle & Native Dialogs',
                    desc: 'Removed external runtime CDNs for genuine air-gapped operation; upgraded modals to accessible native <dialog> elements and strict DOMParser SVG sanitization.'
                  },
                  {
                    title: 'Enterprise Security, Cloud Run v2 IaC & Automated CI',
                    desc: 'Added google-auth-library OIDC verification, __Host- cookies, net.BlockList SSRF + redirect defense, multi-stage non-root Dockerfile, infra/terraform/ module, dra-cli --changed-only & --output github-pr, and Vitest + Go race test suites.'
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-500 shrink-0"
                        aria-hidden="true"
                      />
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* v2.5.0 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-black uppercase tracking-widest">
                  v2.5.0
                </span>
                <span className="text-xs font-bold text-slate-400">September 2026</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li>Added Executive Deployment Verdict Banner, 6-Standard Regulatory Compliance Matrix, and multi-page CISO PDF Brief.</li>
                <li>Introduced Mermaid Topology Map, initial <code>tfplan.json</code> support, and SARIF 2.1.0 CLI output.</li>
              </ul>
            </div>

            {/* v2.0.0 & v1.0.0 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-black uppercase tracking-widest">
                  v2.0.0 &amp; v1.0.0
                </span>
                <span className="text-xs font-bold text-slate-400">June – August 2026</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc list-inside">
                <li>Initial 5-pillar Google Cloud Well-Architected assessment engine, local audit history, and Ollama / LM Studio support.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
