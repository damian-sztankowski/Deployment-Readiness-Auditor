import React, { useState, useRef } from 'react';
import { Play, Upload, RefreshCw, Terminal, ChevronUp, Edit2, FileText, FolderUp, FileCode } from 'lucide-react';

interface InputSectionProps {
  onAnalyze: (code: string) => void;
  isAnalyzing: boolean;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onAnalyze, 
  isAnalyzing, 
  minimized = false, 
  onToggleMinimize 
}) => {
  const [inputCode, setInputCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsReadingFiles(true);
    let combinedCode = "";
    
    // Sort files alphabetically for deterministic output
    const sortedFiles = (Array.from(files) as File[]).sort((a, b) => a.name.localeCompare(b.name));
    
    for (const file of sortedFiles) {
      try {
        const content = await readFileContent(file);
        combinedCode += `### FILE: ${file.name} ###\n${content}\n\n`;
      } catch (err) {
        console.error(`Failed to read ${file.name}`, err);
      }
    }
    
    setInputCode(combinedCode.trim());
    setIsReadingFiles(false);
    
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
                  Upload Files
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    accept=".tf,.json,.yaml,.yml" 
                    multiple 
                  />
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
            placeholder={isReadingFiles ? "Reading files..." : "Paste HCL / JSON here..."}
            className="w-full h-[65vh] min-h-[500px] p-12 font-mono text-lg text-slate-900 dark:text-slate-100 bg-transparent outline-none resize-none leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700"
            spellCheck={false}
          />
          
          <div className="absolute bottom-12 right-12 z-10">
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