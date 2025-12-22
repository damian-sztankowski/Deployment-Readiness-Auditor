import React, { useState } from 'react';
import { 
  Shield, Zap, Cloud, ArrowRight, AlertTriangle, TrendingUp, 
  TrendingDown, ChevronDown, HelpCircle, Brain, FolderSearch, 
  Code2, Gauge, ShieldCheck, Globe, FileCheck, Lock, Scale, 
  BarChart3, Activity, Cpu, Layers, BookOpen, Landmark,
  CheckCircle, MessageSquare, EyeOff, ServerOff, Key
} from 'lucide-react';

interface AboutProps {
  onStartAssessment: () => void;
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-start md:items-center justify-between text-left focus:outline-none group transition-all"
      >
        <span className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors pr-4">
          {question}
        </span>
        <div className={`mt-1 md:mt-0 p-1.5 rounded-xl transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white rotate-180 shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500'}`}>
             <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-8' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-4xl border-l-2 border-indigo-500/20 pl-6 ml-1">
            {answer}
            </p>
        </div>
      </div>
    </div>
  );
};

export const About: React.FC<AboutProps> = ({ onStartAssessment }) => {
  return (
    <div className="animate-enter space-y-20 py-8">
      
      {/* Hero Section: The Dual Engine */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-black text-white p-8 md:p-20 flex flex-col md:flex-row items-center gap-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.15),transparent)] pointer-events-none"></div>

        <div className="flex-1 relative z-10 space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">
            <Layers className="w-3.5 h-3.5" />
            Dual-Analysis Engine
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[1.05] text-white">
            Architecture Audit <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Meets Compliance.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
            The <strong>Deployment Readiness Auditor (DRA)</strong> leverages Gemini models to evaluate your Google Cloud infrastructure against the <span className="text-indigo-300 font-bold">Well-Architected Framework</span> and global regulatory benchmarks in a single pass.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button 
                onClick={onStartAssessment}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
                Start Audit
                <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => <div key={i} className={`w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700`} />)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Used by Cloud Architects</span>
            </div>
          </div>
        </div>

        {/* Visual: Framework Interaction */}
        <div className="flex-1 relative z-10 hidden lg:block">
            <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-pulse blur-3xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-indigo-500/30 rounded-3xl rotate-12 flex items-center justify-center bg-slate-900/40 backdrop-blur">
                         <div className="text-center -rotate-12">
                             <Landmark className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Regulatory</span>
                         </div>
                    </div>
                    <div className="absolute w-64 h-64 border-2 border-emerald-500/30 rounded-3xl -rotate-6 flex items-center justify-center bg-slate-900/40 backdrop-blur">
                         <div className="text-center rotate-6">
                             <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Well-Architected</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* SOVEREIGNTY & PRIVACY - ADDED FOR MVP PUBLIC TRUST */}
      <section className="space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400">Security Sovereignty</h3>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Your Code, Your Quota</h2>
            <p className="text-slate-600 dark:text-slate-400">Building trust in a public ecosystem through transparency and sovereign architecture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 group hover:border-indigo-500 transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <EyeOff className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black">Zero Code Retention</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    DRA processes infrastructure code ephemerally. Your HCL or JSON snippets are sent via encrypted TLS to the Gemini API and purged immediately after the audit cycle is complete.
                </p>
            </div>
            <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 group hover:border-emerald-500 transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <Key className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black">Bring Your Own Key</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Avoid public rate limits by bringing your own Gemini API Key. This ensures your data remains within your own organizational cloud billing and security parameters.
                </p>
            </div>
            <div className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 group hover:border-amber-500 transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <ServerOff className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black">Local-Only History</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    We never save your audit reports on our servers. History is stored exclusively in your browser's LocalStorage, putting data ownership entirely in your hands.
                </p>
            </div>
        </div>
      </section>

      {/* Layer 1: Google Cloud Well-Architected Framework */}
      <section className="space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400">Foundation Layer</h3>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Google Cloud Well-Architected</h2>
            <p className="text-slate-600 dark:text-slate-400">Our primary audit engine scores your resources against the five foundational pillars of Google's official architecture framework.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
                { name: 'Operational Excellence', icon: Activity, color: 'text-blue-500', desc: 'Deployment automation, logging, and incident response readiness.' },
                { name: 'Security & Compliance', icon: Shield, color: 'text-red-500', desc: 'IAM least-privilege, network hardening, and data protection.' },
                { name: 'Reliability', icon: Zap, color: 'text-amber-500', desc: 'High availability, fault tolerance, and disaster recovery posture.' },
                { name: 'Performance Efficiency', icon: Gauge, color: 'text-emerald-500', desc: 'Resource right-sizing and modern hardware selection.' },
                { name: 'Cost Optimization', icon: TrendingDown, color: 'text-teal-500', desc: 'Quantifiable FinOps analysis and waste reduction.' }
            ].map((pillar, i) => (
                <div key={i} className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300">
                    <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 w-fit mb-4 group-hover:scale-110 transition-transform ${pillar.color}`}>
                        <pillar.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-tight">{pillar.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{pillar.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Layer 2: Regulatory & Industry Standards */}
      <section className="space-y-12 py-12 border-y border-slate-100 dark:border-slate-900">
        <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400">Compliance Layer</h3>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">Industry Standards & Regulatory Mapping</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    DRA cross-references every Well-Architected finding with a deep registry of international compliance standards. 
                    This ensures that architectural best practices also satisfy strict regulatory requirements for your specific industry or region.
                </p>
                <div className="flex flex-wrap gap-2">
                    {['Security', 'Privacy', 'Sovereignty', 'Finance', 'Health'].map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">{tag}</span>
                    ))}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { id: 'CIS', name: 'CIS GCP Benchmark' },
                    { id: 'NIST', name: 'NIST 800-53' },
                    { id: 'GDPR', name: 'EU GDPR' },
                    { id: 'FEDRAMP', name: 'FedRAMP' },
                    { id: 'HIPAA', name: 'HIPAA' },
                    { id: 'SOC2', name: 'SOC 2' },
                    { id: 'PCI', name: 'PCI DSS' },
                    { id: 'ISO', name: 'ISO 27001' },
                    { id: 'BSI', name: 'BSI C5' }
                ].map((std) => (
                    <div key={std.id} className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex flex-col gap-1 items-center justify-center text-center">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{std.id}</span>
                        <span className="text-[9px] font-medium text-slate-400 truncate w-full">{std.name}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Why AI? Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                    <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Semantic vs Static Audit</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Static analyzers check for specific strings or syntax. <strong>DRA understands architectural intent.</strong> 
                    By using Gemini models, we can identify logical flaws—like cross-region data egress that violates sovereignty—even if the individual resources are "syntactically" valid.
                </p>
                <ul className="space-y-3">
                    {[
                        'Detects cross-resource relationship risks',
                        'Understands environment context (Prod vs Dev)',
                        'Maps logical flaws to specific NIST/CIS controls',
                        'Generates valid Terraform code for remediations',
                        'Eliminates "Severity Masking" by identifying all-tier risks in a single pass.'
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                 <Code2 className="absolute -right-4 -bottom-4 w-40 h-40 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors" />
                 <h4 className="text-xl font-bold mb-4">How We Audit</h4>
                 <div className="space-y-4 relative z-10">
                    {[
                        { step: '01', title: 'HCL Parsing', desc: 'We extract resource relationships and configuration attributes.' },
                        { step: '02', title: 'Framework Alignment', desc: 'Analysis against the 5 pillars of the Google Cloud Well-Architected docs.' },
                        { step: '03', title: 'Compliance Overlay', desc: 'Risks are mapped to CIS, NIST, and other regulatory frameworks.' },
                        { step: '04', title: 'Remediation Generation', desc: 'Precise Terraform fixes are provided for every high-risk finding.' }
                    ].map((step, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-xs font-black text-indigo-500">{step.step}</span>
                            <div>
                                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{step.title}</h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
      </section>

      {/* Enhanced FAQ Section */}
      <section id="faq-section" className="max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl text-indigo-600 dark:text-indigo-400 mb-2">
             <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Readiness & Security FAQ</h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to know about the auditing process, data security, and compliance mapping.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm transition-all">
             <FAQItem
                question="What makes this different from tools like Checkov, Terrascan, or TFLint?"
                answer="Traditional static analysis tools rely on hardcoded regex or YAML-based policies that check for specific key-value pairs. DRA utilizes LLM-based semantic analysis via the selected Gemini model. This allows the auditor to understand the 'intent' and 'context' of your architecture. For example, DRA can identify that a specific load balancer configuration is under-provisioned for a production workload, or that an IAM role is too broad for the specific service accounts it interacts with, even if the HCL syntax itself is valid."
             />
             <FAQItem
                question="How accurate are the FinOps cost savings estimates?"
                answer="The cost savings provided are heuristic estimates based on current Google Cloud pricing benchmarks known to the underlying Gemini model. While they are highly accurate for identifying 'waste' (like unattached PD-SSD disks or over-provisioned machine types), they should be treated as quantifiable targets rather than absolute billing projections. We recommend validating these findings with the official Google Cloud Pricing Calculator."
             />
             <FAQItem
                question="Is my code used to train models?"
                answer="When using your own Professional Gemini API Key, Google Cloud Vertex/GenAI standard terms apply: your data is NOT used for model training. DRA is designed for zero-retention ephemeral processing. No code is stored on our servers."
             />
             <FAQItem
                question="Does it support high-level designs or only Terraform/HCL?"
                answer="While DRA is optimized for HCL (Terraform), its semantic engine is flexible. You can paste JSON export from GCP asset inventory, YAML configuration files, or even high-level technical descriptions of a planned architecture. The AI will attempt to infer the resource relationships and apply the Well-Architected Framework regardless of the input format."
             />
             <FAQItem
                question="Can I audit multi-file projects or entire folders?"
                answer="Yes. The 'Upload Project' feature allows you to select a directory. DRA will parse and concatenate valid infrastructure files (.tf, .tfvars, .json) into a single context-aware specification for the auditor. This is critical for detecting cross-file dependencies and remote state risks."
             />
             <FAQItem
                question="Which regulatory standards are covered in the mapping?"
                answer="DRA covers a broad spectrum of international and industry-specific frameworks, including the CIS Google Cloud Computing Foundation Benchmark, NIST 800-53 (Security and Privacy Controls), GDPR (General Data Protection Regulation), HIPAA (Health Insurance Portability and Accountability Act), and PCI DSS (Payment Card Industry Data Security Standard). Every finding identifies the specific control ID (e.g., CIS 1.2) to simplify compliance reporting."
             />
             <FAQItem
                question="How does the 'Auto-Remediation' feature work?"
                answer="For every identified risk, the auditor generates a corresponding HCL/Terraform code block that resolves the issue while adhering to best practices. This code is synthesized based on your existing resource definitions, meaning it includes your specific naming conventions and variable structures where possible."
             />
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                    <MessageSquare className="w-8 h-8 text-indigo-500" />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Have more technical questions?</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Our community-driven support is available via GitHub and LinkedIn.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <a 
                    href="https://github.com/damian-sztankowski/Deployment-Readiness-Auditor" 
                    target="_blank"
                    className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black hover:border-indigo-500 transition-all flex items-center gap-2"
                >
                    View Source
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
      </section>
      
      <div className="text-center pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-5 h-5 text-slate-300" />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
              <Globe className="w-5 h-5 text-slate-300" />
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
              <Lock className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
              Deployment Readiness Auditor (DRA) is an independent AI tool for Google Cloud Platform. 
              Assessment findings are based on AI interpretations of the Google Cloud Well-Architected Framework and Industry Standards.
          </p>
      </div>

    </div>
  );
};
