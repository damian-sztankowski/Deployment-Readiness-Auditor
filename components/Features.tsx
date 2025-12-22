import React from 'react';
import { Shield, Sparkles, Zap, Brain, FileText, Code, Database, Compass, CheckCircle } from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      title: "Gemini 3 Pro Intelligence",
      description: "Leverages cutting-edge multimodal models to understand architectural intent beyond simple syntax checks.",
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Full Pillar Audit",
      description: "Evaluates infrastructure against all 5 pillars of the Google Cloud Well-Architected Framework.",
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Compliance Mapping",
      description: "Automatic cross-referencing with CIS Benchmarks, NIST 800-53, GDPR, and HIPAA requirements.",
      icon: Compass,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "FinOps Optimization",
      description: "Identifies waste and provides quantifiable monthly savings estimates for cloud resources.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20"
    },
    {
      title: "Terraform Remediations",
      description: "Generates production-ready HCL code snippets to instantly fix identified vulnerabilities.",
      icon: Code,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Enterprise Reporting",
      description: "Exports professional PDF audit briefs with executive summaries and detailed findings for stakeholders.",
      icon: FileText,
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-900/20"
    }
  ];

  return (
    <div className="animate-enter space-y-16 py-8">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">Capabilities</h3>
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Advanced Infrastructure Auditing</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          The Deployment Readiness Auditor combines semantic AI analysis with official cloud architecture standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featureList.map((f, i) => (
          <div key={i} className="group p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-500">
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
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Next-Gen Auditing
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">How it Works: The Audit Pipeline</h3>
            <div className="space-y-6">
              {[
                { step: "01", title: "Resource Ingestion", desc: "Upload HCL files or paste code. We parse resources and dependencies." },
                { step: "02", title: "LLM Contextualization", desc: "Gemini analyzes the workload type and environment (Production vs Development)." },
                { step: "03", title: "Framework Scanning", desc: "Architecture is checked against five Well-Architected pillars." },
                { step: "04", title: "Compliance Mapping", desc: "Identified risks are mapped to regulatory controls like NIST or GDPR." }
              ].map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <span className="text-lg font-black text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity">{s.step}</span>
                  <div>
                    <h5 className="font-bold text-lg mb-1">{s.title}</h5>
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