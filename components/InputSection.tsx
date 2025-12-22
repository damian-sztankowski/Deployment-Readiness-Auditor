
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Upload, RefreshCw, Terminal, ChevronUp, Edit2, 
  FileCode, FolderUp, Key, X, Save, ShieldCheck, 
  Lock, Zap, ChevronRight, Database, Sparkles
} from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (code: string) => void;
  isAnalyzing: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  showKeyInfo: boolean;
  onCloseKeyInfo: () => void;
  onRunDemo: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onAnalyze, 
  isAnalyzing, 
  minimized = false, 
  onToggleMinimize,
  showKeyInfo,
  onCloseKeyInfo,
  onRunDemo
}) => {
  const [inputCode, setInputCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  
  // Sovereign Key State
  const [tempKey, setTempKey] = useState('');
  const [hasUserKey, setHasUserKey] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('dra-custom-api-key');
    setHasUserKey(!!key);
    if (key) setTempKey(key);
  }, []);

  const saveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('dra-custom-api-key', tempKey.trim());
      setHasUserKey(true);
    } else {
      localStorage.removeItem('dra-custom-api-key');
      setHasUserKey(false);
    }
    onCloseKeyInfo();
    window.location.reload();
  };

  const handleAnalyze = () => {
    if (inputCode.trim()) onAnalyze(inputCode);
  };

  const loadExample = () => {
    const example = `### FILE: main.tf ###
resource "google_storage_bucket" "corporate_data" {
  name          = "corp-data-prod"
  location      = "US"
  force_destroy = true 

  uniform_bucket_level_access = false 

  versioning {
    enabled = false 
  }
}

resource "google_compute_firewall" "allow_all" {
  name    = "allow-all-ingress"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  source_ranges = ["0.0.0.0/0"] 
}

resource "google_compute_instance" "legacy_server" {
  name         = "legacy-app"
  machine_type = "n1-standard-1" 
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-10" 
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}

resource "google_compute_disk" "unattached_disk" {
  name  = "unused-disk-backup"
  type  = "pd-ssd"
  zone  = "us-central1-a"
  size  = 500
}`;
    setInputCode(example);
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    readFileContent(file).then(content => {
      setInputCode(`### FILE: ${file.name} ###\n${content}`);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsReadingFiles(true);
    let combinedCode = "# --- MULTI-FILE PROJECT ---\n\n";
    let fileCount = 0;
    const validExtensions = ['.tf', '.tfvars', '.json', '.yaml', '.yml'];
    const sortedFiles = (Array.from(files) as File[]).sort((a, b) => a.name.localeCompare(b.name));
    for (const file of sortedFiles) {
        const fileName = (file as File).name;
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        const relativePath = (file as any).webkitRelativePath;
        if (validExtensions.includes(ext) && !relativePath.includes('/.git/')) {
            try {
                const content = await readFileContent(file as File);
                if (!content.includes('\0')) {
                    combinedCode += `### FILE: ${relativePath || (file as File).name} ###\n${content}\n\n`;
                    fileCount++;
                }
            } catch (err) {}
        }
    }
    setInputCode(fileCount === 0 ? "# No valid files found." : combinedCode.trim());
    setIsReadingFiles(false);
    if (folderInputRef.current) folderInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  if (minimized) {
    return (
      <div className="w-full max-w-[1400px] mx-auto bg-white dark:bg-[#0a0f1e] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800/60 p-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-8">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl text-indigo-600 dark:text-indigo-400">
                <FileCode className="w-10 h-10" />
            </div>
            <div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-none">Infrastructure Source</h3>
                <p className="text-base text-slate-500 font-mono mt-3">{inputCode.split('\n').length} lines ready for review</p>
            </div>
        </div>
        <button 
            onClick={onToggleMinimize}
            className="flex items-center gap-3 text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-10 py-5 rounded-[1.5rem] transition-all"
        >
            <Edit2 className="w-5 h-5" />
            Modify Infrastructure
        </button>
      </div>
    );
  }

  return (
    <div id="input-section-container" className="relative group w-full max-w-[1400px] mx-auto">
       {/* Background Glow matching the screenshot's depth */}
       <div className="absolute -inset-1 rounded-[2.2rem] bg-indigo-500/10 blur-2xl pointer-events-none"></div>

      <div className="relative bg-white dark:bg-[#0a0f1e] rounded-[2rem] shadow-3xl overflow-hidden border border-slate-200 dark:border-slate-800/80 transition-all duration-500">
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#111827]/40 flex justify-between items-center">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black">
            <Terminal className="w-5 h-5 text-indigo-500" strokeWidth={3} />
            <h3 className="text-base tracking-tight font-black uppercase tracking-widest opacity-90">Deployment Specification</h3>
          </div>
          <div className="flex items-center gap-3" id="action-buttons-group">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".tf,.json,.yaml,.yml" />
              </label>

              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                  <FolderUp className="w-3.5 h-3.5" />
                  Upload Project
                  <input 
                    ref={folderInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleFolderUpload} 
                    {...({ webkitdirectory: '', directory: '' } as any)} 
                    multiple 
                  />
              </label>
              
              <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <button onClick={loadExample} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 px-3 py-2 transition-colors">Example</button>
              
              {onToggleMinimize && inputCode.trim() && (
                  <button onClick={onToggleMinimize} className="p-2 bg-slate-100 dark:bg-[#1e293b]/60 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronUp className="w-4 h-4" /></button>
              )}
          </div>
        </div>
        
        <div className="relative">
          <textarea
            id="code-editor-area"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={isReadingFiles ? "Reading files..." : "Paste HCL here..."}
            className="w-full h-[540px] p-10 font-mono text-base text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
            spellCheck={false}
          />
          
          {/* THE SOVEREIGN KEY BOX - CENTERED IN THE EDITOR AREA */}
          {showKeyInfo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white dark:bg-[#0a0f1e] w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_32px_128px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                  {/* Internal Modal Header */}
                  <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                       <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                          <Key className="w-7 h-7" strokeWidth={2.5} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Sovereignty Setup</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                             Identity & Quota Protocol
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={onCloseKeyInfo} 
                      className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all group"
                    >
                      <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>

                  {/* Internal Body */}
                  <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <Lock className="w-5 h-5" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Privacy</h4>
                           </div>
                           <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Stored in <span className="font-bold text-indigo-500">LocalStorage</span>. Peer-to-peer transit with Google APIs.
                           </p>
                        </div>
                        <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                           <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <Zap className="w-5 h-5" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest">Quota</h4>
                           </div>
                           <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Bypass shared MVP limits for high-fidelity auditing throughput.
                           </p>
                        </div>
                    </div>

                    {/* API KEY INPUT */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Gemini API Credentials</label>
                          {hasUserKey && (
                              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Active
                              </div>
                          )}
                      </div>
                      <div className="relative group/input">
                          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                             <Database className="w-6 h-6 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                          </div>
                          <input 
                            type="password" 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder="Enter AIzaSy... key"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl pl-16 pr-8 py-6 font-mono text-base outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-400"
                          />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-6 border-t border-slate-100 dark:border-slate-800">
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group flex items-center gap-2 text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-all"
                        >
                          Obtain key from Google AI Studio
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-10 py-8 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={saveKey}
                      className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-3xl shadow-2xl shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                      <Save className="w-6 h-6 relative z-10" />
                      <span className="relative z-10 text-xl tracking-tight">Apply Credentials</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-[0.3em] font-bold">
                       Persists in local session
                    </p>
                  </div>
               </div>
            </div>
          )}
          
          <div className="absolute bottom-10 right-10 z-30 flex flex-col items-end gap-5">
            {!inputCode.trim() && !isAnalyzing && (
              <button 
                onClick={onRunDemo}
                className="group flex items-center gap-3 px-8 py-4 bg-white/5 dark:bg-white/[0.03] backdrop-blur-3xl border border-indigo-500/20 hover:border-indigo-500 rounded-2xl text-sm font-black text-indigo-500 dark:text-indigo-400 shadow-2xl transition-all animate-in slide-in-from-bottom-4 duration-700"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                No Key? Try Interactive Showcase
              </button>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
              className={`flex items-center gap-5 px-12 py-6 rounded-[2rem] font-black text-xl shadow-3xl transition-all duration-300 
                ${isAnalyzing || !inputCode.trim() || isReadingFiles
                  ? 'bg-slate-200 text-slate-400 dark:bg-[#1e293b] dark:text-slate-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30 border border-indigo-400/20'}`}
            >
              {isAnalyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
              {isAnalyzing ? "Auditing Intelligence..." : "Run Global Audit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
