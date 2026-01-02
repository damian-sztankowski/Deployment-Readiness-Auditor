import React, { useState, useRef, useMemo } from 'react';
import { 
  Play, Upload, RefreshCw, Terminal, ChevronUp, Edit2, 
  FileCode, FolderUp, Sparkles, ShieldCheck, Fingerprint
} from 'lucide-react';
import { anonymizeHcl } from '../services/dlpService';

interface InputSectionProps {
  onAnalyze: (code: string) => void;
  isAnalyzing: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
  onRunDemo: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onAnalyze, 
  isAnalyzing, 
  minimized = false, 
  onToggleMinimize,
  onRunDemo
}) => {
  const [inputCode, setInputCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  // Real-time DLP feedback
  const dlpStats = useMemo(() => {
    if (!inputCode.trim()) return null;
    return anonymizeHcl(inputCode);
  }, [inputCode]);

  const handleAnalyze = () => {
    if (inputCode.trim()) onAnalyze(inputCode);
  };

  const loadExample = () => {
    const example = `# 1. Project Identifiers & Labels
provider "google" {
  project = "finance-prod-12345" # Targets: project, project_id
  region  = "us-central1"
}

# 2. Identities (PII)
resource "google_compute_instance" "vm_instance" {
  name         = "admin-box"
  machine_type = "e2-medium"

  metadata = {
    # 3. Authentication Data & 4. Emails
    owner-email = "manager@company-internal.com" # Targets: email regex
    api-key     = "AIzaSyB-4X9-2kLp0-SecretKey99" # Targets: api_key, secret, token
  }

  # 5. Network Topography
  network_interface {
    network    = "prod-secure-vpc" # Targets: network, vpc
    subnetwork = "hr-private-subnet" # Targets: subnetwork

    access_config {
      # 6. IP Addresses (Non-well-known)
      nat_ip = "35.192.10.55" # Targets: ipRegex (should be redacted)
    }
  }
}

resource "google_compute_firewall" "allow_all" {
  name    = "dangerous-rule"
  network = "prod-secure-vpc"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  # Auditor Logic Test: 0.0.0.0/0 should NOT be redacted 
  # so the DRA can still flag the security risk.
  source_ranges = ["0.0.0.0/0"]
}
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
    const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
    for (const file of sortedFiles) {
        const fileName = file.name;
        const relativePath = (file as any).webkitRelativePath;
        if (fileName.endsWith('.tf') || fileName.endsWith('.json')) {
            try {
                const content = await readFileContent(file);
                combinedCode += `### FILE: ${relativePath || fileName} ###\n${content}\n\n`;
                fileCount++;
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
                <p className="text-base text-slate-500 font-mono mt-3">{inputCode.split('\n').length} lines • {dlpStats?.redactionCount || 0} sensitive fields protected</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Enterprise DLP Active
            </div>
            <button 
                onClick={onToggleMinimize}
                className="flex items-center gap-3 text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-10 py-5 rounded-[1.5rem] transition-all"
            >
                <Edit2 className="w-5 h-5" />
                Modify Infrastructure
            </button>
        </div>
      </div>
    );
  }

  return (
    <div id="input-section-container" className="relative group w-full max-w-[1400px] mx-auto">
       <div className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-pink-500 via-purple-500 via-cyan-500 to-indigo-500 blur-3xl opacity-15 group-hover:opacity-30 group-focus-within:opacity-40 transition-opacity animate-gradient bg-300% pointer-events-none"></div>

      <div className="relative p-[2.5px] rounded-[2.2rem] bg-gradient-to-r from-indigo-500 via-pink-500 via-purple-500 via-cyan-500 to-indigo-500 animate-gradient bg-300% shadow-3xl overflow-hidden transition-all duration-500 group-focus-within:scale-[1.002]">
        
        <div className="relative bg-white dark:bg-[#0a0f1e] rounded-[calc(2.2rem-2.5px)] overflow-hidden transition-colors">
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#111827]/40 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black">
                <Terminal className="w-5 h-5 text-indigo-500" strokeWidth={3} />
                <h3 className="text-base tracking-tight font-black uppercase tracking-widest opacity-90">Terraform (HCL) Specification</h3>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  Enterprise DLP Active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    Upload .tf
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".tf" />
                </label>

                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl bg-white dark:bg-[#1e293b]/40 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500 transition-all cursor-pointer shadow-sm">
                    <FolderUp className="w-3.5 h-3.5" />
                    Upload Project
                    <input ref={folderInputRef} type="file" className="hidden" onChange={handleFolderUpload} {...({ webkitdirectory: '', directory: '' } as any)} multiple />
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
              placeholder={isReadingFiles ? "Reading files..." : "Paste pure Terraform (HCL) code here..."}
              className="w-full h-[540px] p-10 font-mono text-base text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
              spellCheck={false}
            />

            <div className="absolute bottom-10 right-10 z-30 flex flex-col items-end gap-5">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
                className={`flex items-center gap-5 px-12 py-6 rounded-[2rem] font-black text-xl shadow-3xl transition-all duration-300 
                  ${isAnalyzing || !inputCode.trim() || isReadingFiles
                    ? 'bg-slate-200 text-slate-400 dark:bg-[#1e293b] dark:text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30 border border-indigo-400/20'}`}
              >
                {isAnalyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                {isAnalyzing ? "Auditing Intelligence..." : "Run Audit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};