import React, { useState } from 'react';
import { Shield, Zap, Cloud, ArrowRight, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface AboutProps {
  onStartAssessment: () => void;
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-start md:items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-4">
          {question}
        </span>
        <div className={`mt-1 md:mt-0 p-1 rounded-full transition-all duration-200 ${isOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 rotate-180' : 'bg-transparent'}`}>
             <ChevronDown className={`w-5 h-5 transition-colors ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
        </div>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {answer}
            </p>
        </div>
      </div>
    </div>
  );
};

export const About: React.FC<AboutProps> = ({ onStartAssessment }) => {
  return (
    <div className="animate-enter space-y-16 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-black text-white p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-indigo-900/20 border border-slate-800">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e51a_1px,transparent_1px),linear-gradient(to_bottom,#4f46e51a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="flex-1 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Cloud className="w-3 h-3" />
            Google Cloud Native
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
            GCP Infrastructure <br/>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Analysis Reimagined.</span>
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
            The Deployment Readiness Auditor (DRA) is specialized for Google Cloud. 
            Stop manual reviews. Start deploying Terraform with mathematical confidence using our AI-driven engine.
          </p>
          <button 
            onClick={onStartAssessment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/50"
          >
            Go to Assessment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* New Visual: Simulated Dashboard Card */}
        <div className="flex-1 relative z-10 flex justify-center w-full scale-90 sm:scale-100">
            <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs font-mono text-slate-400">audit_report.json</div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* Left Col: Radar Chart Visualization */}
                    <div className="space-y-4">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">WAF Pillar Analysis</div>
                        <div className="relative h-40 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 border-dashed overflow-hidden">
                            {/* Simulated Radar Chart SVG */}
                            <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-sm">
                                {/* Background Web */}
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" className="dark:stroke-slate-600" />
                                <circle cx="50" cy="50" r="25" fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" className="dark:stroke-slate-600" />
                                <line x1="50" y1="10" x2="50" y2="90" stroke="#cbd5e1" strokeWidth="0.5" className="dark:stroke-slate-600" />
                                <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd5e1" strokeWidth="0.5" className="dark:stroke-slate-600" />
                                <line x1="22" y1="22" x2="78" y2="78" stroke="#cbd5e1" strokeWidth="0.5" className="dark:stroke-slate-600" />
                                <line x1="78" y1="22" x2="22" y2="78" stroke="#cbd5e1" strokeWidth="0.5" className="dark:stroke-slate-600" />
                                
                                {/* Data Polygon */}
                                <polygon points="50,20 80,45 65,80 35,80 20,45" fill="#6366f1" fillOpacity="0.25" stroke="#4f46e5" strokeWidth="1.5" />
                                
                                {/* Data Points */}
                                <circle cx="50" cy="20" r="1.5" fill="#4f46e5" />
                                <circle cx="80" cy="45" r="1.5" fill="#4f46e5" />
                                <circle cx="65" cy="80" r="1.5" fill="#4f46e5" />
                                <circle cx="35" cy="80" r="1.5" fill="#4f46e5" />
                                <circle cx="20" cy="45" r="1.5" fill="#4f46e5" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between text-xs items-center">
                                <span className="text-slate-500 dark:text-slate-400">Op. Excellence</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">98/100</span>
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[98%]"></div>
                             </div>
                             
                             <div className="flex justify-between text-xs items-center">
                                <span className="text-slate-500 dark:text-slate-400">Security</span>
                                <span className="font-bold text-red-500 dark:text-red-400">45/100</span>
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full w-[45%]"></div>
                             </div>
                        </div>
                    </div>

                    {/* Right Col: Findings */}
                    <div className="space-y-3">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center">
                            Key Findings
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold">3 Critical</span>
                        </div>

                        {/* Finding Items */}
                        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-lg p-3 shadow-sm border-l-4 border-l-red-500 hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-colors cursor-default">
                            <div className="flex gap-2 items-start">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">Public IP Exposure</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Instance 'app-prod' has 0.0.0.0/0 ingress.</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 rounded-lg p-3 shadow-sm border-l-4 border-l-red-500 hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-colors cursor-default">
                            <div className="flex gap-2 items-start">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">Open Firewall Rule</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Rule 'allow-all' exposes port 22 globally.</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 shadow-sm border-l-4 border-l-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors cursor-default">
                            <div className="flex gap-2 items-start">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">Legacy Machine Type</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">N1 usage detected. Consider N2D upgrade.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center mb-12">
             <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why use DRA for GCP?</h3>
             <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">We bridge the gap between complex cloud frameworks and your daily Terraform workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">IAM & Security</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Automatically detects overly permissive IAM roles, public storage buckets, and unencrypted disk resources.
                </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <Cloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Terraform Native</h4>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Built for Terraform and Google Cloud Asset Inventory. Paste your `main.tf` and get instant remediation steps.
                </p>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>
          
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-16 text-center relative z-10">How it Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
             {/* Connecting Line - Now Centered Vertically and visible on top of cards */}
             <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-1 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 dark:from-indigo-900 dark:via-indigo-600 dark:to-indigo-900 -translate-y-1/2 z-10"></div>

             {[
                 { title: "Paste Terraform", desc: "Upload your Google Cloud Terraform files directly into the editor." },
                 { title: "AI Analysis", desc: "Gemini scans 5 pillars of the Google Cloud Architecture Framework." },
                 { title: "Get Report", desc: "Receive a detailed PDF report with scores and fixes." }
             ].map((step, i) => (
                 <div key={i} className="relative group h-full">
                     {/* Animated Glow Gradient */}
                     <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-60 blur transition duration-500 animate-gradient bg-300%"></div>
                     
                     {/* Card Content */}
                     <div className="relative h-full bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center transition-transform duration-300 group-hover:-translate-y-1 overflow-hidden z-10">
                         
                         {/* Step Number - Centered Vertically - z-index 20 to sit on top of connection line */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xl flex items-center justify-center shadow-lg z-20 group-hover:border-indigo-500 dark:group-hover:border-indigo-500 transition-colors duration-300">
                             {i + 1}
                         </div>

                         {/* Top Content (Title) */}
                         <div className="mb-auto pb-8">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{step.title}</h4>
                         </div>
                         
                         {/* Bottom Content (Description) */}
                         <div className="mt-auto pt-8">
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                         </div>
                     </div>
                 </div>
             ))}
          </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
             </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h3>
          <p className="text-slate-600 dark:text-slate-400">Common questions about privacy, compatibility, and scoring.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
             <FAQItem
                question="How does the AI analysis work?"
                answer="It uses Google's Gemini Pro model to parse your infrastructure code, comparing resources against the 5 pillars of the Google Cloud Architecture Framework to identify risks."
             />
             <FAQItem
                question="Is my infrastructure code secure?"
                answer="Yes. All analysis happens in real-time. We do not store, log, or train models on your submitted Terraform code or JSON assets. Your code is processed ephemerally."
             />
             <FAQItem
                question="What file formats do you support?"
                answer="Currently, we support Terraform configuration files (.tf) and Google Cloud Asset Inventory JSON exports. Binary plan files are not supported."
             />
             <FAQItem
                question="Can I use this for formal compliance audits?"
                answer="DRA is a pre-deployment readiness tool. While it helps align with standards like CIS or ISO by detecting common misconfigurations, it does not replace a formal certified audit or penetration test."
             />
             <FAQItem
                question="Is this free to use?"
                answer="The application interface is free. However, it requires a Google AI Studio API Key to function, which may have its own usage limits or pricing depending on your Google Cloud plan."
             />
        </div>
      </section>
      
      <div className="text-center pt-8">
          <p className="text-slate-400 text-sm">
              We do not store your data. Code is processed ephemerally.
          </p>
      </div>

    </div>
  );
};