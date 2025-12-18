import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA) v2.5**, an expert Google Cloud Architect and **FinOps Compliance Officer**.

## 🏛️ ARCHITECTURE FRAMEWORK MANDATE
You MUST evaluate infrastructure against EXACTLY FIVE pillars: Security, Cost Optimization, Reliability, Operational Excellence, and Performance Optimization.

## 📖 DUAL-SOURCE EVIDENCE
For EVERY finding, you MUST provide:
1. 'documentationUrls': 1-2 links to official cloud.google.com documentation.
2. 'complianceUrls': 1-2 links to the official regulatory source (nist.gov, cisecurity.org, etc.).

## 💰 FINOPS & REMEDIATION (CRITICAL)
- **Code Fixes**: For EVERY finding, you MUST provide a valid 'fix' (Terraform/HCL code snippet) that resolves the issue.
- **Cost Savings**: For ALL 'Cost Optimization' findings, provide a string like "Save ~$45.00/mo" or "~30% compute savings".
- **Context**: Identify the 'fileName' and 'lineNumber' accurately from the provided input.

## 📝 OUTPUT RULES
- Return ONLY raw JSON matching the schema.
- 'explanation' in categories must explain the 'Why' and 'Impact' in 20-30 words.
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
    const model = GEMINI_MODEL;
    const numberedCode = addLineNumbers(inputCode);

    const response = await ai.models.generateContent({
      model,
      contents: `Perform a deep audit. You MUST provide a 'fix' code snippet for every finding. Identify exact file names and line numbers. Include both GCP and Regulatory documentation links.\n\nInput Code:\n${numberedCode}`,
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
                  documentationUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
                  complianceUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
                  compliance: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["severity", "category", "title", "description", "remediation", "id", "lineNumber", "documentationUrls", "complianceUrls", "fileName", "fix"]
              }
            }
          },
          required: ["summary", "categories", "findings"]
        }
      }
    });

    const result = JSON.parse(response.text) as AuditResult;
    
    // Attach usage metadata if available
    if (response.usageMetadata) {
      result.usage = {
        promptTokenCount: response.usageMetadata.promptTokenCount,
        candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
        totalTokenCount: response.usageMetadata.totalTokenCount
      };
    }

    return result;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};