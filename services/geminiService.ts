import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

/**
 * PRODUCTION MVP KEY STRATEGY:
 * 1. Check for user-provided key in localStorage (BYOK) - Priority.
 * 2. Fallback to injected process.env.API_KEY (Global MVP Key).
 */
const getActiveApiKey = () => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('dra-custom-api-key');
    if (userKey) return userKey;
  }
  // This is shimmed in index.html and replaced by server.js at runtime
  return (window as any).process?.env?.API_KEY || "";
};

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect.
Your mission is to perform a **SINGLE-PASS, EXHAUSTIVE AUDIT**. You must identify **ALL** violations (from Critical to Info) in the first run. 
**DO NOT** hide minor issues just because critical issues exist. 
**DO NOT** prioritize brevity over completeness.

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
Evaluate against:
1. **Security** (Zero Trust, CIS Benchmark, Maximize the security of your data and workloads in the cloud, design for privacy, and align with regulatory requirements and standards.)
2. **Cost Optimization** (Waste elimination, right-sizing. Maximize the business value of your investment in Google Cloud.)
3. **Reliability** (HA, Backups, Protection. Design and operate resilient and highly available workloads in the cloud.)
4. **Operational Excellence** (Monitoring, Labels.Efficiently deploy, operate, monitor, and manage your cloud workloads.)
5. **Performance** (Modern machine types.Design and tune your cloud resources for optimal performance.)

### 🧠 EXHAUSTIVE ANALYSIS PROTOCOL (STRICT)
You MUST iterate through EVERY resource block defined in the code and perform these checks:

1.  **Resource-by-Resource Scan**:
    - Take Resource A.
    - Check against ALL 5 Pillars.
    - If Resource A has 3 violations (e.g., 1 Critical Security + 1 Medium Cost + 1 Low Ops), **LIST ALL THREE SEPARATELY**.
    - Move to Resource B.

2.  **Anti-Masking Rule**:
    - Never suppress a "Low" or "Medium" finding because a "Critical" one exists.
    - Example: If a bucket is Public (Critical) AND lacks labels (Low), report BOTH.

3.  **Default Assumptions**:
    - If a specific configuration block is missing (e.g., 'encryption {}'), assume the default GCP behavior. If the default is insecure or not best-practice, flag it.

### 📝 OUTPUT REQUIREMENTS
- **Code Fixes**: Valid HCL snippets.
- **Compliance**: Map to **CIS GCP Benchmark**, **NIST 800-53**, or **PCI DSS**.
- **Specificity**: Tie every finding to a specific 'fileName' and 'lineNumber'.
- **Cost Optimization**: For cost estimations, use pricing from "us-central1" region.

### 🚫 NEGATIVE CONSTRAINTS
- Do NOT incrementalize findings. Give me the full list NOW.
- Do NOT hallucinate line numbers.
- Return raw JSON only.
- Do NOT assess other hyperscalers terraform code. If you find different hyperscaler, return *CRITICAL** with proper info.
`;


const addLineNumbers = (code: string): string => {
  const lines = code.split('\n');
  let currentLine = 1;
  return lines.map((line) => {
    if (line.trim().startsWith('### FILE:')) {
      currentLine = 1;
      return line;
    }
    return `${currentLine++} | ${line}`;
  }).join('\n');
};

export const analyzeInfrastructure = async (inputCode: string): Promise<AuditResult> => {
  const apiKey = getActiveApiKey();
  
  if (!apiKey) {
    throw new Error("No API Key detected. Please provide your own Gemini API Key in the Settings (Key icon) to proceed.");
  }

  if (!inputCode.trim()) {
    throw new Error("Input cannot be empty.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const numberedCode = addLineNumbers(inputCode);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Perform a deep audit. You MUST provide structured 'compliance' info for every finding. Provide a 'fix' code snippet for every finding. Identify exact file names and line numbers.\n\nInput Code:\n${numberedCode}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        seed: 42,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ["Safe", "Warning", "Critical"] },
                  explanation: { type: Type.STRING }
                },
                required: ["name", "score", "status", "explanation"]
              }
            },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low", "Info"] },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  remediation: { type: Type.STRING },
                  fix: { type: Type.STRING },
                  fileName: { type: Type.STRING },
                  lineNumber: { type: Type.INTEGER },
                  costSavings: { type: Type.STRING },
                  compliance: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        standard: { type: Type.STRING },
                        controlId: { type: Type.STRING },
                        description: { type: Type.STRING },
                        impact: { type: Type.STRING }
                      },
                      required: ["standard", "controlId", "description", "impact"]
                    }
                  }
                },
                required: ["severity", "category", "title", "description", "remediation", "id", "lineNumber", "fileName", "fix", "compliance"]
              }
            }
          },
          required: ["summary", "categories", "findings"]
        }
      }
    });

    const result = JSON.parse(response.text) as AuditResult;
    
    if (response.usageMetadata) {
      result.usage = {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount
      };
    }

    return result;
  } catch (error: any) {
    console.error("Analysis failed:", error);
    
    if (error.message?.includes('429')) {
      throw new Error("Public Quota Exceeded. The global trial key is rate-limited. To continue immediately, please add your own API Key in Settings.");
    }
    if (error.message?.includes('403')) {
      throw new Error("Invalid API Key or Restriction Error. Please verify your settings or provide a valid Gemini key.");
    }
    
    throw error;
  }
};
