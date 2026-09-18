import React from 'react';
import { 
  Shield, Sparkles, Zap, Brain, FileText, Code, Database, 
  Compass, CheckCircle, ShieldAlert, Fingerprint, Lock,
  AlertOctagon, CheckCircle2, GitBranch, Network, FileCheck,
  Cpu, Terminal, Activity, Layers
} from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      title: "Executive Deployment Verdict",
      description: "Immediate Go/No-Go release gatekeeper (BLOCKED, CONDITIONAL, PRODUCTION READY) with blast radius indicators (CRITICAL, MODERATE, LOW) and letter maturity grade (A+ to F).",
      icon: AlertOctagon,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20"
    },
    {
      title: "Multi-Framework Compliance Matrix",
      description: "Standard-by-standard interactive cards and searchable tables mapping infrastructure flaws directly to CIS GCP v2.0, NIST 800-53, GDPR, HIPAA, PCI DSS, and SOC 2 controls.",
      icon: Compass,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "CISO Executive PDF Brief",
      description: "Boardroom-ready multi-page audit report featuring executive metrics, pillar scorecards, compliance tables, code fixes, and formal 3-party governance sign-off blocks.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Automated Remediation Bundle",
      description: "One-click 'Remediate All' export of unified Git patches (dra-remediation.patch applicable via git apply) and consolidated remediated-infrastructure.tf code.",
      icon: GitBranch,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Interactive Topology Map",
      description: "Automatically visualizes infrastructure topology and risk mapping using dynamic Mermaid diagrams with zoom, pan, and full-screen inspection.",
      icon: Network,
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-900/20"
    },
    {
      title: "Terraform Plan JSON (tfplan.json)",
      description: "Audits pre-deployment execution plans (terraform show -json) by evaluating planned runtime changes (change.after) before resources are provisioned.",
      icon: FileCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "FinOps Monthly Waste Intelligence",
      description: "Specifically pinpoints reclaimable cloud budget with monthly dollar waste estimates ($/mo) and right-sizing recommendations for GCP compute and storage.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20"
    },
    {
      title: "DevSecOps CLI & CI/CD Gates",
      description: "Standalone dra-cli with pipeline pass/fail thresholds (--fail-on, --min-score), SARIF 2.1.0 output for GitHub Security tab, and PR Markdown summaries.",
      icon: Terminal,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Zero-Knowledge DLP & Rate Limiting",
      description: "Built-in high-entropy redactor for project IDs, GCP service account keys, and IP addresses, plus sliding-window DoW rate limiting.",
      icon: Fingerprint,
      color: "text-slate-500 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800"
    }
  ];

  return (
    <div className="animate-enter space-y-28 py-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">Platform Capabilities</h3>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Enterprise Infrastructure Auditor</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          The Deployment Readiness Auditor combines specialized <span className="text-indigo-600 dark:text-indigo-400 font-bold">Google Cloud AI semantics</span> with official Well-Architected standards, regulatory controls, and automated remediation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featureList.map((f, i) => (
          <div key={i} className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-500">
            <div className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
              <f.icon className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4">{f.title}</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{f.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Sovereign Pipeline
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">How it Works: The Audit Pipeline</h3>
            <div className="space-y-8">
              {[
                { step: "01", title: "Stateful Anonymization", desc: "Local pre-processor identifies sensitive IDs, API keys, and IPs, replacing them with consistent semantic aliases." },
                { step: "02", title: "Relationship Logic Evaluation", desc: "Gemini models evaluate pure Terraform (HCL) and execution plan (tfplan.json) topology without seeing proprietary data." },
                { step: "03", title: "Multi-Pillar Framework Scan", desc: "Architecture is evaluated against the 5 Well-Architected pillars: Security, Cost/FinOps, Reliability, Ops, and Performance." },
                { step: "04", title: "Regulatory Standard Mapping", desc: "All gaps are mapped to specific controls in CIS GCP v2.0, NIST 800-53, GDPR, HIPAA, PCI DSS, and SOC 2." },
                { step: "05", title: "Remediation & Governance Export", desc: "Generates unified Git patches (.patch), CISO PDF briefs, and SARIF 2.1.0 alerts for CI/CD gates." }
              ].map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <span className="text-lg font-black text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity">{s.step}</span>
                  <div>
                    <h5 className="font-bold text-lg mb-2">{s.title}</h5>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 hidden lg:flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse"></div>
              <Shield className="w-full h-full text-indigo-500/20 animate-morph" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-24 h-24 text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
