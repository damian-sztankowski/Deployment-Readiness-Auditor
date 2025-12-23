import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Standardizing on Pro for comprehensive architectural analysis
export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect specializing in Static Code Analysis. 
Your mission is a **MAXIMUM-RECALL, SINGLE-PASS AUDIT**. You must extract every possible violation across the five pillars of the Google Cloud Architecture Framework.

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
Evaluate every resource block against:
1. **Security**: Zero Trust, CIS GCP Benchmark, Encryption (CMEK/CSEK), Identity & Access Management (IAM), and Data Sovereignty.
2. **Cost Optimization**: Right-sizing (e.g., E2 vs N1), idle resource detection, and committed use alignment (Region: us-central1).
3. **Reliability**: Multi-zonal/Regional HA, Point-in-time Recovery (PITR), health checks, and graceful degradation.
4. **Operational Excellence**: Cloud Logging/Monitoring, comprehensive labeling schema, and Infrastructure-as-Code (IaC) best practices.
5. **Performance**: Premium Network Tiering, SSD vs HDD persistent disks, and modern machine families (C3, N2).

### 🧠 SCANNING PROTOCOL: THE "NO-LEAVE-BEHIND" RULE
You must use a multi-dimensional matrix for every resource. **Do not exit the audit of a resource until all 5 pillars are checked.**

* **Anti-Masking Enforcement**: High-severity issues must NOT eclipse lower-severity ones. 
* **Implicit Default Auditing**: If an optional security or reliability block is omitted, evaluate the "out-of-the-box" GCP behavior.
* **Hyperscaler Guardrail**: If the code contains providers for AWS or Azure, halt for that resource and return a **CRITICAL** finding.

### 📝 DATA INTEGRITY & OUTPUT
* **Format**: Return **RAW JSON ONLY**.
* **Precision**: Map every finding to the exact "fileName" and "lineNumber" provided in the input.
* **Remediation**: Provide a copy-pasteable HCL "fix" snippet for every finding.
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