import React from 'react';
import { Github, Linkedin, ExternalLink, Cpu, Globe, ShieldCheck, Sparkle } from 'lucide-react';
import { Logo } from './Logo';
import { GEMINI_MODEL } from '../services/geminiService';

export const Footer: React.FC = () => {
  const formattedModelName = GEMINI_MODEL
    .replace('gemini-', 'Gemini ')
    .replace('-preview', ' Preview')
    .replace('flash', 'Flash')
    .replace('pro', 'Pro')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <footer className="w-full mt-auto relative border-t border-slate-100 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl">
      {/* Visual Accents spanning full width */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
      
      <div className="max-w-[2200px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-12 items-start">
          
          <div className="space-y-10">
            <div className="flex items-center gap-10 group cursor-default">
              <div className="relative py-2 px-3">
                <Logo size="md" className="group-hover:animate-morph-fast transition-all duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none group-hover:text-indigo-600 transition-colors">
                  Deployment Readiness Auditor
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">
                  Architecture Integrity Assurance
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 w-fit">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                Engine: {formattedModelName}
              </span>
            </div>
            
            <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Providing deep architectural insights and risk mitigation protocols for the next generation of Google Cloud infrastructure.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative group">
              {/* ANIMATED GRADIENT BORDER WRAPPER */}
              <div className="absolute -inset-[1.5px] bg-gradient-to-r from-cyan-400 via-indigo-400 via-purple-400 via-pink-400 to-cyan-400 rounded-[2.1rem] animate-gradient bg-300% opacity-100"></div>
              
              {/* OUTER SOFT GLOW */}
              <div className="absolute -inset-[4px] bg-gradient-to-r from-cyan-400/30 via-indigo-400/30 via-purple-400/30 via-pink-400/30 to-cyan-400/30 rounded-[2.3rem] blur-md opacity-0 group-hover:opacity-100 transition duration-700 animate-gradient bg-300%"></div>
              
              {/* INNER BOX - DARKENED BACKGROUND */}
              <div className="relative px-12 py-10 bg-slate-100 dark:bg-[#080c1a] rounded-[2rem] flex flex-col items-center gap-5 shadow-2xl overflow-hidden">
                {/* Subtle Background Glass Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/[0.02] dark:to-transparent pointer-events-none"></div>
                
                <div className="relative">
                  <Cpu className="w-10 h-10 text-indigo-500 animate-float" />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Core Intelligence</p>
                  <p className="text-lg font-black bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    Google GenAI SDK
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-10">
            <div className="flex items-center gap-6">
               <a href="#" className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:scale-110">
                  <Github className="w-7 h-7" />
               </a>
               <a href="#" className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all duration-300 shadow-sm hover:scale-110">
                  <Linkedin className="w-7 h-7" />
               </a>
            </div>

            <nav className="flex flex-col items-start md:items-end gap-5">
               <a href="https://docs.cloud.google.com/architecture/framework" target="_blank" className="flex items-center gap-3 text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors group">
                 Cloud Architecture Framework
                 <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
               </a>
               <div className="flex items-center gap-3 text-sm font-black text-slate-400">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  Zero-Knowledge Analysis Protocol
               </div>
            </nav>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">
            © 2025 Deployment Readiness Auditor / Damian Sztankowski
          </div>
          <div className="flex items-center gap-12">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  Security First
              </span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  No Data Retention
              </span>
          </div>
        </div>
      </div>
    </footer>
  );
};