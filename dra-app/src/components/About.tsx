import React from 'react';
import {
  Shield,
  Zap,
  ArrowRight,
  TrendingDown,
  HelpCircle,
  Brain,
  Code2,
  Gauge,
  ShieldCheck,
  Globe,
  Lock,
  Scale,
  Activity,
  Cpu,
  Layers,
  Landmark,
  CheckCircle,
  EyeOff,
  ServerOff,
  Fingerprint,
  Binary,
  ShieldAlert,
  Tag
} from 'lucide-react';

interface AboutProps {
  onStartAssessment: () => void;
}

const FAQ_ITEMS = [
  {
    question: 'How does DRA v3.1 improve upon both Checkov/TFLint and pure LLM auditors?',
    answer:
      'Pure static linters miss cross-resource architectural flaws, while pure LLM wrappers can hallucinate line numbers or fall victim to prompt injection. DRA v3.1 runs a Hybrid Pipeline: a deterministic HCL/K8s/Docker AST pass anchors exact start/end lines, interpolates variables.tf + .tfvars, and enforces hard CIS GCP v2.0 score ceilings—then Gemini 4 Hydrogen (or Gemini 4 Carbon) synthesizes multi-hop attack paths and executive guidance.'
  },
  {
    question: 'How does Bidirectional Client-Side DLP protect proprietary cloud identifiers?',
    answer:
      'Both the DRA Web UI and dra-cli execute anonymizeHcl locally BEFORE sending code over HTTP. High-entropy credentials (AIzaSy..., AKIA..., PEM private keys, tokens) are permanently scrubbed, while non-secret identifiers (project IDs, VPCs, emails, private IPs) are mapped to semantic aliases (e.g. CLOUD_ID_1, NETWORK_TOPOGRAPHY_1) kept only in client memory. When results return, non-secret aliases are restored locally so your HCL fixes work immediately without ever exposing real names to external LLMs.'
  },
  {
    question: 'Which Infrastructure as Code formats are supported in v3.0?',
    answer:
      'DRA v3.0 audits Terraform (.tf, .tfvars), OpenTofu (.tofu), evaluated Terraform Plan JSON (tfplan.json via terraform show -json), Kubernetes & GKE manifests (.yaml/.yml), and container Dockerfiles—alongside .dra.yaml Organization Policy & Waiver files.'
  },
  {
    question: 'Can DRA run 100% offline in air-gapped environments or without a Gemini API key?',
    answer:
      'Yes! Unlike earlier versions that relied on runtime CDN scripts, DRA v3.0 bundles all frontend assets locally via Vite + Tailwind CSS. You can select the built-in Deterministic AST Engine (zero API key, $0 cost, instant offline execution) or connect to local Ollama / LM Studio endpoints on localhost.'
  },
  {
    question: 'How do .dra.yaml Organization Policies and Time-Bounded Risk Waivers work?',
    answer:
      'Platform teams can commit a .dra.yaml file defining requiredLabels (e.g. environment, owner, cost_center), allowedRegions (e.g. europe-west* for GDPR sovereignty), bannedMachinePrefixes (n1-, f1-), and expiring waivers (with approvedBy, reason, and ISO expires date). Valid unexpired waivers move findings into the Accepted Risk Waivers attestation section of the CISO PDF without blocking CI/CD; once expired, they automatically revert to active gate blockers.'
  },
  {
    question: 'Are the generated .patch files compatible with git apply?',
    answer:
      'Yes. DRA v3.0 diffs remediated HCL blocks directly against your uploaded source files to emit standard POSIX unified diffs (diff --git a/... b/..., context lines, and exact hunk headers) verified against git apply --check, and previews them in an interactive Side-by-Side Diff modal.'
  },
  {
    question: 'How accurate is the v3.0 FinOps Cloud Billing SKU Calculator?',
    answer:
      'Instead of relying solely on LLM string guesses, DRA v3.0 includes a deterministic GCP Cloud Billing SKU engine with regional pricing multipliers (us-central1, europe-west1, europe-west3, asia-northeast1, etc.), count multipliers, Committed Use Discount (CUD) targets, external IPv4 fees, and unattached Persistent Disk detection.'
  },
  {
    question: 'How is DRA hardened for production Google Cloud Run deployments?',
    answer:
      'Production deployments serve static assets strictly from dist/public, enforce constant-time SHA-256 secret checks and google-auth-library OIDC audience/domain verification, sign multi-instance sessions with __Host-dra_session cookies, block IPv4/IPv6 SSRF & HTTP 302 redirects via net.BlockList, sanitize Mermaid SVGs in strict mode via DOMParser, and ship with a self-audited Cloud Run v2 + Secret Manager + Workload Identity Terraform stack in infra/terraform/.'
  }
];

export const About: React.FC<AboutProps> = ({ onStartAssessment }) => {
  return (
    <div className="animate-enter space-y-32 py-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-black text-white p-8 md:p-20 flex flex-col md:flex-row items-center gap-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.15),transparent)] pointer-events-none" />

        <div className="flex-1 relative z-10 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-sky-400/25 text-sky-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            DRA v3.1 • Command Studio &amp; Gemini 4 Governance
          </div>
          <h1
            id="main-heading"
            tabIndex={-1}
            className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-white"
          >
            Deterministic Precision <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Meets Gemini 4 Reasoning.
            </span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
            The <strong>Deployment Readiness Auditor (DRA v3.1)</strong> audits{' '}
            <code className="text-sky-300">*.tf</code>,{' '}
            <code className="text-sky-300">*.tofu</code>,{' '}
            <code className="text-sky-300">tfplan.json</code>,{' '}
            <code className="text-sky-300">GKE YAML</code>, and{' '}
            <code className="text-sky-300">Dockerfiles</code> against the{' '}
            <strong>Google Cloud Well-Architected Framework</strong>, 6 regulatory standards, and custom{' '}
            <code className="text-emerald-300">.dra.yaml</code> policies before changes hit production.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onStartAssessment}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Launch Hybrid Audit
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-10 hidden lg:block">
          <div className="relative w-full aspect-square max-w-md mx-auto">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-pulse blur-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-indigo-500/30 rounded-3xl rotate-12 flex items-center justify-center bg-slate-900/40 backdrop-blur">
                <div className="text-center -rotate-12">
                  <Landmark className="w-12 h-12 text-indigo-400 mx-auto mb-2" aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    CIS • NIST • GDPR • SOC2
                  </span>
                </div>
              </div>
              <div className="absolute w-64 h-64 border-2 border-emerald-500/30 rounded-3xl -rotate-6 flex items-center justify-center bg-slate-900/40 backdrop-blur">
                <div className="text-center rotate-6">
                  <ShieldCheck
                    className="w-12 h-12 text-emerald-400 mx-auto mb-2"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                    Hybrid AST + Gemini 4
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="space-y-12 max-w-6xl mx-auto py-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            3-Step Workflow
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            From IaC to Verified Git Patch in Seconds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm hover:border-indigo-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Ingest IaC &amp; .dra.yaml</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Paste or upload <code className="text-indigo-500">.tf</code>,{' '}
              <code className="text-indigo-500">.tofu</code>,{' '}
              <code className="text-indigo-500">tfplan.json</code>, Kubernetes YAML, or Dockerfiles—and optionally configure organizational guardrails &amp; waivers in the{' '}
              <strong>Org Policy (.dra.yaml)</strong> tab.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm hover:border-indigo-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Select Hybrid or Offline Engine</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Choose <strong>Gemini 4 Hydrogen / Carbon + AST</strong>, zero-key{' '}
              <strong>Offline Deterministic AST</strong>, or local <strong>Ollama / LM Studio</strong>. Stream live SSE progress across DLP, AST, FinOps SKUs, Policy, and AI stages.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm hover:border-indigo-500 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Diff, Ask Architect &amp; Export</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Jump directly to flagged lines, inspect <strong>Side-by-Side Diffs</strong>, apply{' '}
              <code className="text-emerald-500">dra-remediation.patch</code> via{' '}
              <code>git apply</code>, consult the <strong>Principal Architect Co-Pilot</strong>, or export the multi-page CISO PDF Brief.
            </p>
          </div>
        </div>
      </section>

      {/* Bidirectional DLP Section */}
      <section className="relative py-12">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              Zero-Knowledge Client-Side Privacy
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
              Bidirectional Semantic <br />
              <span className="text-emerald-600 dark:text-emerald-400">Client-Side DLP.</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
              In v3.0, sensitive identifiers never leave your browser or CLI in plaintext—yet your returned HCL fixes still contain your exact real resource names.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Fingerprint,
                  title: 'Client-Side Aliasing',
                  desc: 'Project IDs, VPCs, and emails become CLOUD_ID_1 & NETWORK_TOPOGRAPHY_1 locally before HTTP transmission.'
                },
                {
                  icon: Binary,
                  title: 'Irreversible Secret Scrub',
                  desc: 'GCP keys (AIzaSy...), AWS keys, PEM private keys, and passwords are permanently redacted.'
                },
                {
                  icon: Globe,
                  title: 'Local De-Aliasing',
                  desc: 'Returned HCL fixes and Mermaid diagrams automatically restore non-secret aliases in browser/CLI memory.'
                },
                {
                  icon: Scale,
                  title: 'Auditable Waivers',
                  desc: 'Time-bounded .dra.yaml risk exceptions are tracked cleanly without muting underlying visibility.'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 shadow-sm"
                >
                  <item.icon className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  <h4 className="text-sm font-black uppercase tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 order-1 lg:order-2 w-full">
            <div className="relative p-1 bg-gradient-to-br from-emerald-500/40 to-indigo-500/40 rounded-[3rem] shadow-2xl">
              <div className="bg-white dark:bg-slate-950 rounded-[calc(3rem-4px)] p-8 md:p-10 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>1. Local Editor Input</span>
                    <span className="text-rose-500">Raw Identifiers &amp; Secret</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    project = &quot;bank-prod-123&quot;
                    <br />
                    network = &quot;swift-core-vpc&quot;
                    <br />
                    api_key = &quot;AIzaSyB-LiveKey99&quot;
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    <span>2. Sent Over Wire to Audit Engine</span>
                    <span>Zero Raw PII/Secrets</span>
                  </div>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl font-mono text-[11px] text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                    project = &quot;CLOUD_ID_1&quot;
                    <br />
                    network = &quot;NETWORK_TOPOGRAPHY_1&quot;
                    <br />
                    api_key = &quot;[REDACTED_GCP_API_KEY]&quot;
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    <span>3. Restored Locally in Remediation Fix</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Ready for git apply
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    project = &quot;bank-prod-123&quot;
                    <br />
                    network = &quot;swift-core-vpc&quot;
                    <br />
                    api_key = data.google_secret_manager_secret_version.app.secret_data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Well-Architected Pillars */}
      <section className="space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">
            Foundation Layer
          </h3>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Google Cloud Well-Architected
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Every workload is scored across all five official pillars with configurable{' '}
            <code>.dra.yaml</code> weights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            {
              name: 'Operational Excellence',
              icon: Activity,
              color: 'text-blue-500',
              desc: 'Mandatory governance labels, IaC modularity, and observability readiness.'
            },
            {
              name: 'Security & Compliance',
              icon: Shield,
              color: 'text-red-500',
              desc: 'Zero-trust VPC perimeters, least-privilege IAM, Secret Manager, and CIS v2.0.'
            },
            {
              name: 'Reliability',
              icon: Zap,
              color: 'text-amber-500',
              desc: 'Regional Cloud SQL HA, PITR backups, GCS versioning, and deletion protection.'
            },
            {
              name: 'Performance Efficiency',
              icon: Gauge,
              color: 'text-emerald-500',
              desc: 'Modern E2/N4/Axion C4A compute generations and Hyperdisk storage.'
            },
            {
              name: 'Cost Optimization',
              icon: TrendingDown,
              color: 'text-teal-500',
              desc: 'Regional GCP Billing SKU modeling, CUDs, Private Google Access, and zombie disk cleanup.'
            }
          ].map((pillar, i) => (
            <div
              key={i}
              className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 w-fit mb-4 ${pillar.color}`}
              >
                <pillar.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">
                {pillar.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Native Exclusive Accordion FAQ (per modern-web-guidance `html` §5) */}
      <section aria-labelledby="faq-heading" className="max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2
            id="faq-heading"
            className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter"
          >
            Architecture &amp; Security FAQ (v3.0)
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 md:p-12 divide-y divide-slate-200 dark:divide-slate-800 shadow-sm">
          {FAQ_ITEMS.map((item, idx) => (
            <details key={idx} name="dra-faq" className="group py-5 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-sm font-black group-open:bg-indigo-600 group-open:text-white group-open:rotate-45 transition-all"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed border-l-2 border-indigo-500/30 pl-5">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
