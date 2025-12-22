import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Activity, X, Zap, Brain, Wand2, ChevronRight, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
  onRunDemo: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart, onRunDemo }) => {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const showcaseSteps = [
    {
      title: "Semantic Analysis",
      subtitle: "Beyond Basic Linting",
      description: "DRA doesn't just check for syntax. It uses Gemini's multi-modal intelligence to understand architectural intent, identifying risks that static analyzers miss.",
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      accent: "border-purple-500/20"
    },
    {
      title: "Cloud Frameworks",
      subtitle: "Official GCP Alignment",
      description: "Every audit is measured against the 5 pillars of the Google Cloud Well-Architected Framework: Security, Reliability, Cost, Operations, and Performance.",
      icon: ShieldCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      accent: "border-indigo-500/20"
    },
    {
      title: "Compliance Mapping",
      subtitle: "Regulatory Guardrails",
      description: "Automatically map infrastructure flaws to international standards including CIS Benchmarks, NIST 800-53, GDPR, HIPAA, and SOC2.",
      icon: Lock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      accent: "border-emerald-500/20"
    },
    {
      title: "One-Click Fixes",
      subtitle: "Instant Remediation",
      description: "Don't just find problems—fix them. DRA generates production-ready Terraform (HCL) snippets to remediate every high-risk finding instantly.",
      icon: Wand2,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      accent: "border-amber-500/20"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative overflow-hidden bg-[#020617]">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-12">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-16">
                <div className="relative flex items-center justify-center">
                    <Logo 
                        size="xl" 
                        animate={true}
                        className="transform transition-transform duration-700 hover:scale-110" 
                    />
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-8 animate-enter">
                <div className="inline-block relative group">
                    <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        Enterprise Audit Intelligence
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.85] pt-4">
                    Deployment Readiness<br/>
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent bg-300% animate-gradient">
                        Auditor
                    </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                    Analyze architectural integrity against the 
                    <span className="text-indigo-400 font-bold mx-2">Google Cloud Framework</span> 
                    using advanced AI semantics.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-enter pt-12 flex flex-col md:flex-row items-center justify-center gap-6" style={{ animationDelay: '0.2s' }}>
                
                {/* Primary Action */}
                <div className="relative group inline-block w-full md:w-auto">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient bg-300%"></div>
                    <button 
                        onClick={onStart}
                        className="relative w-full md:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-indigo-600 text-white rounded-2xl text-xl font-black tracking-tight shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-95"
                    >
                        Scan Infrastructure
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>

                {/* SHOWCASE ACTION */}
                <button 
                    onClick={onRunDemo}
                    className="w-full md:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-white/5 hover:bg-white/10 backdrop-blur-2xl text-indigo-400 rounded-2xl text-xl font-black border border-indigo-500/20 transition-all duration-300 group shadow-xl"
                >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    Interactive Showcase
                </button>

                {/* LEARN MORE AS BUTTON */}
                <button 
                    onClick={() => setIsLearnMoreOpen(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-6 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-slate-800 transition-all group"
                >
                    <HelpCircle className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    Learn More
                </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-16 animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "WAF Pillars", color: "text-indigo-400" },
                    { icon: Lock, text: "Compliance", color: "text-emerald-400" },
                    { icon: Activity, text: "FinOps Audit", color: "text-amber-400" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-[10px] font-black text-slate-300 uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-colors cursor-default">
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                        {feature.text}
                    </div>
                ))}
            </div>
        </div>

        {/* Showcase Modal */}
        {isLearnMoreOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                <div 
                    className="absolute inset-0 bg-slate-950/95 backdrop-blur-md transition-opacity" 
                    onClick={() => setIsLearnMoreOpen(false)}
                />
                
                <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[500px]">
                    <button 
                        onClick={() => setIsLearnMoreOpen(false)}
                        className="absolute top-8 right-8 z-20 p-4 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-500 rounded-2xl transition-all duration-300 group shadow-lg"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                    
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/50 p-10 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 space-y-6">
                        <div className="mb-10">
                           <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Core Protocol</h3>
                           <p className="text-2xl font-black text-slate-900 dark:text-white">Audit Pillars</p>
                        </div>
                        <div className="space-y-3">
                            {showcaseSteps.map((step, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStep(i)}
                                    className={`w-full flex items-center gap-5 p-5 rounded-2xl transition-all text-left group/nav
                                        ${activeStep === i 
                                            ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700' 
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400'}
                                    `}
                                >
                                    <div className={`p-3 rounded-xl transition-colors ${activeStep === i ? step.bg + ' ' + step.color : 'bg-slate-200 dark:bg-slate-800'}`}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-tight ${activeStep === i ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                        {step.title}
                                    </span>
                                    {activeStep === i && <ChevronRight className="w-4 h-4 ml-auto text-indigo-500" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-12 md:p-20 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                        
                        <div key={activeStep} className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                            <div className={`w-24 h-24 rounded-3xl ${showcaseSteps[activeStep].bg} ${showcaseSteps[activeStep].color} flex items-center justify-center border ${showcaseSteps[activeStep].accent} shadow-2xl`}>
                                {React.createElement(showcaseSteps[activeStep].icon, { className: "w-12 h-12" })}
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h4 className={`text-xs font-black uppercase tracking-[0.3em] mb-3 ${showcaseSteps[activeStep].color}`}>
                                        {showcaseSteps[activeStep].subtitle}
                                    </h4>
                                    <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                        {showcaseSteps[activeStep].title}
                                    </h3>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed max-w-lg font-medium">
                                    {showcaseSteps[activeStep].description}
                                </p>
                            </div>

                            <div className="pt-6 flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Production Ready
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    AI Sovereignty
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 flex items-center justify-between">
                             <div className="flex gap-2">
                                {showcaseSteps.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-2 rounded-full transition-all duration-500 ${activeStep === i ? 'w-10 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
                                    />
                                ))}
                             </div>
                             <button 
                                onClick={onStart}
                                className="px-10 py-4 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-base font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-600/20"
                             >
                                Get Started
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};