import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Upload, RefreshCw, Terminal, ChevronUp, Edit2, 
  FileCode, FolderUp, Key, X, Save, ShieldCheck, Globe, 
  Lock, Zap, Cpu, Fingerprint, ChevronRight, AlertCircle, 
  Database 
} from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (code: string) => void;
  isAnalyzing: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  showKeyInfo: boolean;
  onCloseKeyInfo: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onAnalyze, 
  isAnalyzing, 
  minimized = false, 
  onToggleMinimize,
  showKeyInfo,
  onCloseKeyInfo
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
      <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-8">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl text-indigo-600 dark:text-indigo-400">
                <FileCode className="w-10 h-10" />
            </div>
            <div>
                <h3 className="font-black text-2xl text-slate-900 dark:text-white leading-none">Infrastructure Source</h3>
                <p className="text-base text-slate-500 font-mono mt-3">{inputCode.split('\n').length} lines ready for review</p>
            </div>
        </div>
        <button 
            onClick={onToggleMinimize}
            className="flex items-center gap-3 text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-10 py-5 rounded-[1.5rem] transition-all"
        >
            <Edit2 className="w-5 h-5" />
            Modify Infrastructure
        </button>
      </div>
    );
  }

  return (
    <div id="input-section-container" className="relative group">
       <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 opacity-40 blur-2xl animate-gradient bg-300%"></div>

      <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-3xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all duration-500">
        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white font-black">
            <Terminal className="w-7 h-7 text-indigo-600" />
            <h3 className="text-2xl tracking-tight">Deployment Specification</h3>
          </div>
          <div className="flex items-center gap-4" id="action-buttons-group">
              <label className="flex items-center gap-3 text-sm font-black text-slate-600 dark:text-slate-300 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                  <Upload className="w-5 h-5" />
                  Upload File
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".tf,.json,.yaml,.yml" />
              </label>

              <label className="flex items-center gap-3 text-sm font-black text-slate-600 dark:text-slate-300 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                  <FolderUp className="w-5 h-5" />
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
              
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>

              <button onClick={loadExample} className="text-base font-black text-indigo-600 hover:text-indigo-700 px-6 py-3.5">Example</button>
              
              {onToggleMinimize && inputCode.trim() && (
                  <button onClick={onToggleMinimize} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900"><ChevronUp className="w-6 h-6" /></button>
              )}
          </div>
        </div>
        
        <div className="relative">
          <textarea
            id="code-editor-area"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={isReadingFiles ? "Reading files..." : "Paste HCL here..."}
            className="w-full h-[65vh] min-h-[600px] p-12 font-mono text-lg text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
            spellCheck={false}
          />
          
          {/* THE SOVEREIGN KEY BOX - CENTERED IN THE EDITOR AREA (RED SQUARE LOCATION) */}
          {showKeyInfo && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                  {/* Internal Modal Header */}
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                          <Key className="w-6 h-6" strokeWidth={2.5} />
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Sovereignty Setup</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                             Identity & Quota Protocol
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={onCloseKeyInfo} 
                      className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all group"
                    >
                      <X className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-90 transition-transform" />
                    </button>
                  </div>

                  {/* Internal Body */}
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                              <Lock className="w-4 h-4" />
                              <h4 className="text-[9px] font-black uppercase tracking-widest">Privacy</h4>
                           </div>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                              Stored in <span className="font-bold text-indigo-500">LocalStorage</span>. Peer-to-peer transit with Google APIs.
                           </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <Zap className="w-4 h-4" />
                              <h4 className="text-[9px] font-black uppercase tracking-widest">Quota</h4>
                           </div>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                              Bypass shared MVP limits for high-fidelity auditing throughput.
                           </p>
                        </div>
                    </div>

                    {/* API KEY INPUT */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Gemini API Credentials</label>
                          {hasUserKey && (
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                  <ShieldCheck className="w-3 h-3" />
                                  Active
                              </div>
                          )}
                      </div>
                      <div className="relative group/input">
                          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                             <Database className="w-5 h-5 text-slate-300 group-focus-within/input:text-indigo-500 transition-colors" />
                          </div>
                          <input 
                            type="password" 
                            value={tempKey}
                            onChange={(e) => setTempKey(e.target.value)}
                            placeholder="Enter AIzaSy... key"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-5 font-mono text-sm outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-300"
                          />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 py-4 border-t border-slate-100 dark:border-slate-800">
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-all"
                        >
                          Obtain key from Google AI Studio
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={saveKey}
                      className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Save className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 text-lg tracking-tight">Apply Credentials</span>
                    </button>
                    <p className="text-[9px] text-center text-slate-400 mt-3 uppercase tracking-[0.2em] font-medium">
                       Persists in local session
                    </p>
                  </div>
               </div>
            </div>
          )}
          
          <div className="absolute bottom-12 right-12 z-30">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
              className={`flex items-center gap-4 px-14 py-7 rounded-[2rem] font-black text-xl shadow-2xl transition-all duration-300 
                ${isAnalyzing || !inputCode.trim() || isReadingFiles
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30'}`}
            >
              {isAnalyzing ? <RefreshCw className="w-7 h-7 animate-spin" /> : <Play className="w-7 h-7 fill-current" />}
              {isAnalyzing ? "Auditing Intelligence..." : "Run Global Audit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};