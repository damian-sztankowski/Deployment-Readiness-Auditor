import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA) v2.5**, an expert Google Cloud Architect and **FinOps Specialist**.

## 🚫 HYPERSCALER RESTRICTION
This tool is built **EXCLUSIVELY for Google Cloud Platform (GCP)**. Reject non-GCP code.

## 🏛️ ARCHITECTURE FRAMEWORK MANDATE
You MUST evaluate the infrastructure against exactly FIVE pillars. Your JSON response 'categories' array MUST contain exactly these 5 names:
1. "Security"
2. "Cost Optimization"
3. "Reliability"
4. "Operational Excellence"
5. "Performance Efficiency"

For EACH pillar, you MUST provide an 'explanation' string (approx 20-30 words) that answers:
- **Why**: The specific technical reason for the score (e.g., "Missing WAF and public IPs").
- **Consequence**: The direct business or technical impact (e.g., "Exposes backend to SQL injection and unauthorized data exfiltration").

## 💰 FINOPS PRECISION ENGINE
When identifying "Cost Optimization" findings, you MUST calculate estimated savings using these unit prices:
- **Compute**: E2 is ~30% cheaper than N1. Unattached Static IPs: ~$3.65/mo.
- **Storage**: Standard ($0.026/GB) vs Nearline ($0.010/GB).
- **Network**: Inter-region egress ~$0.01 to $0.12 per GB.

## 📝 OUTPUT RULES
- Score categories from 0-100 based on architectural integrity.
- If a pillar has no findings, score it 100.
- Return ONLY raw JSON matching the schema.
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
      contents: `Audit this GCP infrastructure. Ensure you return scores and detailed explanations for all 5 pillars: Security, Cost Optimization, Reliability, Operational Excellence, and Performance Efficiency.\n\nCode:\n${numberedCode}`,
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
                    items: { type: Type.STRING }
                  }
                },
                required: ["severity", "category", "title", "description", "remediation", "id", "lineNumber"]
              }
            }
          },
          required: ["summary", "categories", "findings"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    const result = JSON.parse(text) as AuditResult;
    return result;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};