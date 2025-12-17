import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA)**, an expert Google Cloud Architect and **FinOps Specialist**.

## 🚫 HYPERSCALER RESTRICTION
This tool is built **EXCLUSIVELY for Google Cloud Platform (GCP)**. Reject non-GCP code.

## 💰 FINOPS PRECISION ENGINE (2024/2025 Benchmarks)
When identifying "Cost Optimization" findings, you MUST calculate estimated savings using these unit prices:

### 1. Compute Engine (Monthly / 730hrs)
- **N1 vs E2 Migration**: E2 is ~30% cheaper. (e.g., n1-std-1 is ~$34/mo, e2-std-1 is ~$24/mo. Saving: $10/mo).
- **Spot Instances**: ~60-91% discount vs On-Demand.
- **Idle IPs**: Unattached Static IPs cost ~$3.65/mo ($0.005/hr).
- **PD-SSD to PD-Balanced**: ~15% cost reduction.

### 2. Cloud Storage (Per GB/mo - US-Multi)
- **Standard**: $0.026
- **Nearline**: $0.010 (Saving: $0.016/GB)
- **Coldline**: $0.007
- **Archive**: $0.0012
- *Example*: Moving 1TB from Standard to Nearline saves ~$16/mo.

### 3. Cloud SQL
- **HA (High Availability)**: Doubles the cost of the instance and storage.
- **Idle Instances**: Database idling at 0-5% CPU represents 100% waste of the core hourly cost.

### 4. Networking
- **Inter-region Egress**: ~$0.01 to $0.12 per GB depending on zone.
- **Cloud NAT**: ~$0.045/hr + Data processing.

## ⚙️ Calculation Protocol
- Identify the resource and its quantity.
- Apply the benchmark price.
- Format \`costSavings\` strictly as: "Save $[Amount]/mo" or "Save [Percentage]%" followed by a brief logic (e.g., "Save $12.50/mo by switching to E2").

## 📝 Output Requirements
Return ONLY raw JSON matching the schema. Score categories from 0-100.
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
      contents: `Audit this GCP infrastructure. Provide high-accuracy FinOps estimations using the provided benchmarks.\n\nCode:\n${numberedCode}`,
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
                  status: { type: Type.STRING, enum: ["Safe", "Warning", "Critical"] }
                },
                required: ["name", "score", "status"]
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