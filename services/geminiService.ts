import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Standardizing on Pro for comprehensive architectural analysis
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
- **Compliance**: Map results to best mached: **CIS GCP Benchmark** **NIST 800-53**, **PCI DSS**, **EU GDPR**, **FedRAMP**, **HIPAA**, **SOC 2**, **ISO 27001**, **BSI C5**. 
- **Specificity**: Tie every finding to a specific 'fileName' and 'lineNumber'.
- **Cost Optimization**: For cost estimations, use pricing from "us-central1" region.
* **Remediation**: Provide a copy-pasteable HCL "fix" snippet for every finding.

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
  if (!inputCode.trim()) {
    throw new Error("AUDIT_ERROR: Input configuration is empty.");
  }

  // Diagnostic check for API key availability
  const apiKey = (window as any).process?.env?.API_KEY;

  if (!apiKey || apiKey === "" || apiKey === "__DRA_API_KEY_PLACEHOLDER__") {
    console.error("Environment Check Failed: API_KEY is missing or unresolved placeholder.");
    throw new Error("CONFIG_ERROR: The API_KEY environment variable failed to bind. The application is seeing the placeholder instead of your key. Check your deployment's --set-env-vars configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const numberedCode = addLineNumbers(inputCode);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Perform a deep audit. Provide structured findings with compliance mapping and code fixes.\n\nInput Code:\n${numberedCode}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
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

    const result = JSON.parse(response.text || "{}") as AuditResult;
    
    if (response.usageMetadata) {
      result.usage = {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount
      };
    }

    return result;
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || "";
    
    if (msg.includes('403') || msg.includes('permission_denied')) {
        throw new Error("AUTH_ERROR: API Key lacks permission. Verify your Google AI Studio project and billing status.");
    } else if (msg.includes('401') || msg.includes('invalid api key')) {
        throw new Error("AUTH_ERROR: The API Key is rejected as invalid by Google.");
    } else if (msg.includes('429')) {
        throw new Error("LIMIT_ERROR: Rate limit exceeded. Try again in 60 seconds.");
    }
    
    throw new Error(`SYSTEM_ERROR: ${error.message || "An unexpected engine failure occurred."}`);
  }
};