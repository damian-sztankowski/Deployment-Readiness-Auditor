import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

/**
 * According to Google GenAI SDK Coding Guidelines:
 * 1. API key must be obtained exclusively from process.env.API_KEY.
 * 2. initialization must use: new GoogleGenAI({ apiKey: process.env.API_KEY }).
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect.
Your mission is to perform a **SINGLE-PASS, EXHAUSTIVE AUDIT**. You must identify **ALL** violations (from Critical to Info) in the first run. 

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
Evaluate against:
1. **Security** (Zero Trust, CIS Benchmark, Data Privacy, Regulatory standards.)
2. **Cost Optimization** (Waste elimination, right-sizing.)
3. **Reliability** (HA, Backups, Protection.)
4. **Operational Excellence** (Monitoring, Labels.)
5. **Performance** (Modern machine types.)

### 🧠 EXHAUSTIVE ANALYSIS PROTOCOL
You MUST iterate through EVERY resource block and check against ALL 5 Pillars.
Flag every finding tied to a specific 'fileName' and 'lineNumber'.

### 🚫 NEGATIVE CONSTRAINTS
- Return raw JSON only.
- Map to CIS GCP Benchmark, NIST 800-53, or PCI DSS where relevant.
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
    throw new Error("Input cannot be empty.");
  }

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
    console.error("Analysis failed:", error);
    if (error.message?.includes('429')) {
      throw new Error("Quota Exceeded. The global trial key is rate-limited.");
    }
    throw error;
  }
};
