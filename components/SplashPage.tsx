import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Lock, Activity, Play, X, Zap, Brain, Wand2, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface SplashPageProps {
  onStart: () => void;
}

export const SplashPage: React.FC<SplashPageProps> = ({ onStart }) => {
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
    <div className="flex flex-col items-center justify-center min-h-screen py-12 relative overflow-hidden">
        
        {/* Center Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-10">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-12">
                <div className="relative flex items-center justify-center">
                    <Logo 
                        size="xl" 
                        animate={true}
                        className="transform transition-transform duration-700 hover:scale-110" 
                    />
                </div>
            </div>

            {/* Hero Typography */}
            <div className="space-y-6 animate-enter">
                <div className="inline-block relative group">
                    <div className="absolute -inset-2 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 dark:bg-slate-900 border border-indigo-500/30 text-indigo-400 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl">
                        Enterprise Audit Intelligence
                    </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] pt-4">
                    Deployment Readiness <br/>
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 bg-clip-text text-transparent bg-300% animate-gradient">
                        Auditor
                    </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                    Analyze architectural integrity against the 
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold mx-2">Google Cloud Framework</span> 
                    using advanced AI semantics.
                </p>
            </div>

            {/* CTA Buttons */}
            <div className="animate-enter pt-8 flex flex-col sm:flex-row items-center justify-center gap-6" style={{ animationDelay: '0.2s' }}>
                
                {/* Primary Action */}
                <div className="relative group inline-block w-full sm:w-auto">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500 animate-gradient bg-300%"></div>
                    <button 
                        onClick={onStart}
                        className="relative w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-indigo-600 text-white rounded-full text-xl font-black tracking-tight shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-95"
                    >
                        Scan Infrastructure
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>

                {/* Secondary Action - Replaced Video with Showcase */}
                <button 
                    onClick={() => setIsLearnMoreOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-2xl text-slate-700 dark:text-slate-200 rounded-full text-xl font-bold border border-slate-200/50 dark:border-white/10 transition-all duration-300 group"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <BarChart3 className="w-5 h-5 ml-0" />
                    </div>
                    Learn More
                </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-12 animate-enter" style={{ animationDelay: '0.4s' }}>
                {[
                    { icon: ShieldCheck, text: "WAF Pillars", color: "text-indigo-400" },
                    { icon: Lock, text: "Compliance", color: "text-emerald-400" },
                    { icon: Activity, text: "FinOps Audit", color: "text-amber-400" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-xl border border-white/5 text-xs font-black text-slate-300 uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-colors">
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
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" 
                    onClick={() => setIsLearnMoreOpen(false)}
                />
                
                <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[500px]">
                    <button 
                        onClick={() => setIsLearnMoreOpen(false)}
                        className="absolute top-6 right-6 z-20 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-500 rounded-2xl transition-all duration-300 group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                    
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/50 p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="mb-8">
                           <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Intelligence</h3>
                           <p className="text-xl font-black text-slate-900 dark:text-white">Core Pillars</p>
                        </div>
                        <div className="space-y-2">
                            {showcaseSteps.map((step, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStep(i)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group/nav
                                        ${activeStep === i 
                                            ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700' 
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400'}
                                    `}
                                >
                                    <div className={`p-2 rounded-xl transition-colors ${activeStep === i ? step.bg + ' ' + step.color : 'bg-slate-200 dark:bg-slate-800'}`}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-bold ${activeStep === i ? 'text-slate-900 dark:text-white' : 'text-slate-500 group-hover/nav:text-slate-700 dark:group-hover/nav:text-slate-300'}`}>
                                        {step.title}
                                    </span>
                                    {activeStep === i && <ChevronRight className="w-4 h-4 ml-auto text-indigo-500" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10 md:p-16 flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div key={activeStep} className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                            <div className={`w-20 h-20 rounded-3xl ${showcaseSteps[activeStep].bg} ${showcaseSteps[activeStep].color} flex items-center justify-center border ${showcaseSteps[activeStep].accent} shadow-inner`}>
                                {React.createElement(showcaseSteps[activeStep].icon, { className: "w-10 h-10" })}
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-[0.2em] mb-2 ${showcaseSteps[activeStep].color}`}>
                                        {showcaseSteps[activeStep].subtitle}
                                    </h4>
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {showcaseSteps[activeStep].title}
                                    </h3>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-md">
                                    {showcaseSteps[activeStep].description}
                                </p>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Production Ready
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Zero Knowledge
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 flex items-center justify-between">
                             <div className="flex gap-1.5">
                                {showcaseSteps.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${activeStep === i ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
                                    />
                                ))}
                             </div>
                             <button 
                                onClick={onStart}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
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