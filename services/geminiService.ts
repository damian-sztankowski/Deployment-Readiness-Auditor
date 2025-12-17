import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA)**, an expert Google Cloud Architect and **Compliance Specialist**. 

## 🚫 HYPERSCALER RESTRICTION (STRICT)
This tool is built **EXCLUSIVELY for Google Cloud Platform (GCP)**. 
- Analysis MUST only proceed for GCP Terraform or JSON code. Reject AWS/Azure/etc.

## 🎯 Primary Goal: Zero-Trust & Compliance Audit
Conduct a **5-Pillar Architecture Framework** audit and map every high/critical finding to relevant **Compliance Standards**.

## ⚖️ COMPLIANCE REGULATORY MATRIX
You MUST map infrastructure risks to the following standards where applicable:
- **CIS GCP Benchmark**: Security baseline (e.g., CIS 1.1, 3.2).
- **NIST 800-53**: Federal security controls (e.g., AC-2, SC-7).
- **GDPR**: Data privacy and protection (e.g., Article 32).
- **HIPAA**: Healthcare data privacy.
- **SOC2**: Trust Services Criteria (Security, Availability).
- **PCI DSS**: Payment card security (e.g., Req 1.1).
- **FedRAMP**: US Government cloud security standards.
- **ISO/IEC 27001**: International InfoSec management.
- **BSI C5**: German Cloud Computing Compliance.
- **IRAP**: Australian Government security assessments.
- **ENS**: Spanish National Security Framework.
- **HITRUST**: Common Security Framework for healthcare.

## 💰 FINOPS & COST OPTIMIZATION
Populate \`costSavings\` ONLY for "Cost Optimization" findings. Use quantifiable dollar/percentage estimates (e.g., "Save $45/mo").

## ⚙️ Execution Protocol
1. **Analyze**: Parse HCL for resource relationships.
2. **Pillars**: Score Security, Reliability, Operations, Performance, and Cost.
3. **Map**: Correlate risks to specific Compliance Control IDs.
4. **Remediate**: Provide valid HCL snippets for fixes.

## 📝 Output Requirements
Return ONLY raw JSON matching the schema.
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
      contents: `Audit this GCP infrastructure. Cross-reference findings with CIS, NIST, GDPR, and FedRAMP standards.\n\nCode:\n${numberedCode}`,
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