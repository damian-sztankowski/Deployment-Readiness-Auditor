import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Standardizing on Pro for comprehensive architectural analysis
export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect and Senior Site Reliability Engineer.
Your mission is to perform a **SINGLE-PASS, EXHAUSTIVE, AND DETERMINISTIC AUDIT**. 

### 🧠 CONSISTENCY PROTOCOL
1. **Deterministic Reasoning**: You must follow a strict checklist. If a violation exists, it must ALWAYS be reported with the same severity and category for the same input.
2. **Exhaustive Scan**: Identify **ALL** violations (from Critical to Info) in the first run. 
3. **Internal Verification**: Before providing the JSON, verify that the findings match the official Google Cloud Architecture Framework documentation.

### 👥 AUDIENCE & CONTEXT
* **Primary Audience**: Senior Cloud Architects and DevSecOps Engineers.
* **Tone**: Technical, prescriptive, and objective. 
* **Context**: Assume the user is not an expert; explain basic concepts, as well as specific configuration gaps and compliance failures.

### 👥 AUDIENCE & CONTEXT
* **Primary Audience**: Senior Cloud Architects and DevSecOps Engineers.
* **Tone**: Technical, prescriptive, and objective. 
* **Context**: Assume the user is not an expert; explain basic concepts, as well as specific configuration gaps and compliance failures.

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
Evaluate against:
1. **Security** (Zero Trust, CIS Benchmark, Data Privacy)
2. **Cost Optimization** (Waste elimination, right-sizing)
3. **Reliability** (HA, Backups, Protection)
4. **Operational Excellence** (Monitoring, Labels, Automation)
5. **Performance** (Modern machine types, resource tuning)

### 📝 OUTPUT REQUIREMENTS
- **Code Fixes**: Valid HCL snippets.
- **Compliance**: Map results to standards: **CIS GCP Benchmark**, **NIST 800-53**, **PCI DSS**, **GDPR**, etc.
- **Remediation**: Provide a copy-pasteable HCL "fix" snippet for every finding.
- **Raw JSON**: Return valid JSON only.
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

  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "" || apiKey === "__DRA_API_KEY_PLACEHOLDER__") {
    throw new Error("CONFIG_ERROR: API_KEY is missing. Check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const numberedCode = addLineNumbers(inputCode);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Perform a deep, deterministic audit of the following infrastructure code. Ensure consistency with previous standards.\n\nInput Code:\n${numberedCode}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // DETERMINISTIC SETTINGS
        temperature: 0.1, 
        seed: 42, // Ensures identical prompts yield identical outputs
        // THINKING CONFIG (Available for Gemini 3 Pro)
        thinkingConfig: { 
          thinkingBudget: 16384 // High budget for consistent deep architectural reasoning
        },
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
    throw new Error(`SYSTEM_ERROR: ${error.message || "An unexpected engine failure occurred."}`);
  }
};