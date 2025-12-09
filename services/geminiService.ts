import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA)**, an expert Google Cloud Architect and Security Specialist. Your mandate is to conduct a **Zero-Trust-aligned, 5-Pillar Architecture Framework compliance audit** on the provided Infrastructure-as-Code (Terraform HCL) or Google Cloud configuration (JSON).

## 🎯 Primary Goal
Analyze the provided configuration against the **5 Pillars of the Google Cloud Architecture Framework** (Security, Cost Optimization, Operational Excellence, Reliability, Performance Efficiency).

## 📄 Input Handling (Multi-File Projects)
The input may contain multiple files concatenated with headers like "### FILE: path/to/file.tf ###".
* Treat these files as a **SINGLE cohesive project**.
* **Context Awareness:** You must analyze cross-file references.

## ⚙️ Execution Protocol
1.  **IDENTIFY:** Scan for risks, anti-patterns, and misconfigurations.
2.  **CLASSIFY:** Assign a Severity (Critical, High, Medium, Low) based on the Rubric below.
3.  **PILLAR ASSESSMENT:** Evaluate the health of each of the 5 pillars (0-100 scale) based on the findings.

## ⚖️ Severity Rubric
* **CRITICAL:** Immediate security breach (public access), data loss risk (no backups), or hardcoded secrets.
* **HIGH:** Major deviation from best practices (legacy hardware, HTTP, default VPC).
* **MEDIUM:** Operational friction or cost inefficiency (missing labels, oversized instances).
* **LOW:** Nits, style, naming conventions.

## 📝 Output Requirements
**STRICT PRICING RULE:** DO NOT provide dollar amounts.
**OUTPUT FORMAT:** Return **ONLY** raw JSON matching the schema.
`;

export const analyzeInfrastructure = async (inputCode: string): Promise<AuditResult> => {
  if (!inputCode.trim()) {
    throw new Error("Input cannot be empty.");
  }

  try {
    const model = "gemini-2.5-pro";
    
    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this Google Cloud infrastructure configuration.\n\nCode:\n${inputCode}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0, // Zero temp for maximum consistency
        seed: 42,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary of the audit findings." },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Pillar name (e.g. Security, Reliability)" },
                  score: { type: Type.NUMBER, description: "0-100 score for this pillar based on findings" },
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
                  category: { type: Type.STRING, description: "Related Architecture Framework Pillar" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  remediation: { type: Type.STRING },
                  fix: { type: Type.STRING, description: "Terraform HCL code snippet to fix the issue. Required for CRITICAL/HIGH." },
                  compliance: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of related compliance controls e.g. 'CIS 1.2', 'NIST SC-7'" 
                  }
                },
                required: ["severity", "category", "title", "description", "remediation", "id"]
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