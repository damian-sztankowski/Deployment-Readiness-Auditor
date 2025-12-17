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
    if (inputCode.trim()) {
      onAnalyze(inputCode);
    }
  };

  const loadExample = () => {
    const example = `### FILE: main.tf ###
resource "google_storage_bucket" "corporate_data" {
  name          = "corp-data-prod"
  location      = "US"
  force_destroy = true # RISK: Data Loss Risk

  uniform_bucket_level_access = false # RISK: Security Pillar (ACLs are legacy)

  versioning {
    enabled = false # RISK: Reliability Pillar
  }
}

resource "google_compute_firewall" "allow_all" {
  name    = "allow-all-ingress"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  source_ranges = ["0.0.0.0/0"] # RISK: Critical Security Flaw
}

resource "google_compute_instance" "legacy_server" {
  name         = "legacy-app"
  machine_type = "n1-standard-1" # RISK: Cost/Perf (N1 is older gen)
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-10" # RISK: Security (End of Life)
    }
  }

  network_interface {
    network = "default"
    access_config {
      # Ephemeral public IP assigned
    }
  }
}

resource "google_compute_disk" "unattached_disk" {
  name  = "unused-disk-backup"
  type  = "pd-ssd"
  zone  = "us-central1-a"
  size  = 500
  # RISK: Cost (Unattached disk costing money)
}`;
    setInputCode(example);
    if (minimized && onToggleMinimize) {
        onToggleMinimize();
    }
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
      if (content.includes('\0')) {
        const warningMsg = `# ⚠️ WARNING: This looks like a binary Terraform plan file.
# The Auditor cannot parse binary plans directly.
#
# To analyze this plan, convert it to JSON:
# $ terraform show -json ${file.name} > plan.json
#
# Then upload 'plan.json'.
# ------------------------------------------------------------------
`;
        setInputCode(warningMsg + "Binary content hidden.");
      } else {
        // Prepend file header so the auditor knows the filename
        setInputCode(`### FILE: ${file.name} ###\n${content}`);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    let combinedCode = "# --- PROJECT ANALYSIS ---\n\n";
    let fileCount = 0;

    const validExtensions = ['.tf', '.tfvars', '.json', '.yaml', '.yml'];

    // Sort files to keep main.tf or versions.tf near top if possible, mostly alphabetical
    const sortedFiles = (Array.from(files) as File[]).sort((a, b) => a.name.localeCompare(b.name));

    for (const file of sortedFiles) {
        // Simple extension check
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        // Exclude .git folder stuff or lock files if they slipped in
        if (validExtensions.includes(ext) && !file.webkitRelativePath.includes('/.git/')) {
            try {
                const content = await readFileContent(file);
                // Skip binary check for now assuming extension filter works, but safeguard:
                if (!content.includes('\0')) {
                     // Use relative path if available (from folder upload), else name
                    const path = file.webkitRelativePath || file.name;
                    combinedCode += `### FILE: ${path} ###\n${content}\n\n`;
                    fileCount++;
                }
            } catch (err) {
                console.warn(`Failed to read file ${file.name}`, err);
            }
        }
    }

    if (fileCount === 0) {
        setInputCode("# No valid Infrastructure-as-Code files (.tf, .json, .yaml) found in the selected folder.");
    } else {
        setInputCode(combinedCode.trim());
    }
    
    setIsReadingFiles(false);
    if (folderInputRef.current) folderInputRef.current.value = '';
    if (minimized && onToggleMinimize) onToggleMinimize();
  };

  // Minimized View
  if (minimized) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <FileText className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Configuration Source</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{inputCode.split('\n').length} lines of code analyzed</p>
            </div>
        </div>
        <button 
            onClick={onToggleMinimize}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg transition-colors"
        >
            <Edit2 className="w-4 h-4" />
            Edit & Re-run
        </button>
      </div>
    );
  }

  // Expanded View with Animated Glow
  return (
    <div id="input-section-container" className="relative group z-0 rounded-2xl">
       {/* The Animated Gradient Glow Layer */}
       <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-60 blur-lg transition-all duration-500 group-hover:opacity-90 animate-gradient bg-300%"></div>
       
       {/* The Animated Gradient Border Layer (Sharper) */}
       <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-80 transition-all duration-500 group-hover:opacity-100 animate-gradient bg-300%"></div>

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-900/10 overflow-hidden transition-all duration-300">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-md">
               <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3>Infrastructure Configuration</h3>
          </div>
          <div className="flex gap-2" id="action-buttons-group">
              <label className="group flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800" title="Upload single .tf or .json file">
                  <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  Upload File
                  <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      accept=".tf,.json,.yaml,.yml"
                  />
              </label>

              <label className="group flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800" title="Upload a folder of Terraform files">
                  <FolderUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  Upload Folder
                  <input 
                      ref={folderInputRef}
                      type="file" 
                      className="hidden" 
                      onChange={handleFolderUpload}
                      // @ts-ignore - directory attribute is standard in webkit but not in React types yet
                      webkitdirectory="" 
                      directory="" 
                      multiple
                  />
              </label>
              
              <button 
                  id="load-example-btn"
                  onClick={loadExample}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-transparent"
              >
                  Load Example
              </button>
              
              {onToggleMinimize && inputCode.trim() && (
                  <button 
                      onClick={onToggleMinimize}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Collapse"
                  >
                      <ChevronUp className="w-4 h-4" />
                  </button>
              )}
          </div>
        </div>
        
        <div className="relative group">
          <textarea
            id="code-editor-area"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={isReadingFiles ? "Reading files from folder..." : "Paste Terraform code, or Upload a File/Folder to analyze complete projects..."}
            className="w-full h-[50vh] min-h-[300px] max-h-[800px] p-6 font-mono text-sm text-slate-900 dark:text-slate-100 bg-slate-50/30 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 outline-none resize-none transition-all leading-6 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            spellCheck={false}
          />
          
          {/* Floating Action Button */}
          <div className="absolute bottom-6 right-6 z-10" id="analyze-fab-container">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputCode.trim() || isReadingFiles}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transform transition-all duration-200 
                ${isAnalyzing || !inputCode.trim() || isReadingFiles
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:translate-y-[-2px] hover:shadow-indigo-500/40 active:scale-95'}`}
            >
              {isAnalyzing || isReadingFiles ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {isReadingFiles ? "Reading Files..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Run Audit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};