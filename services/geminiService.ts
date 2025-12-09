import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the Deployment Readiness Auditor (DRA), an expert Google Cloud Architect and Security Specialist.

Your Goal: Analyze the provided Infrastructure-as-Code (Terraform) or Google Cloud configuration (JSON) against the 5 Pillars of the Google Cloud Architecture Framework.

MULTI-FILE PROJECTS:
The input may contain multiple files concatenated with headers like "### FILE: path/to/file.tf ###".
Treat these files as a SINGLE cohesive project. Analyze relationships between resources across files.

TASKS:
1. SCORING: Evaluate against Operational Excellence, Security, Reliability, Performance, and Cost Optimization (Qualitative).
2. FINDINGS: Identify risks based on the Rubric below.
3. COMPLIANCE: Map each finding to SPECIFIC, GRANULAR standards. Do not use generic headers.
   - CIS Google Cloud Foundation Benchmark v3.0: Use exact ID (e.g., 'CIS 3.0 5.2.1', 'CIS 2.0 4.1').
   - NIST 800-53 Rev 5: Use specific control + enhancement (e.g., 'NIST SC-7(5)', 'NIST AC-6(1)', 'NIST SI-4(12)').
   - PCI-DSS v4.0: Use specific requirement ID (e.g., 'PCI 1.3.2', 'PCI 8.2.1').
4. CODE FIXES: For CRITICAL and HIGH severity issues, provide a specific Terraform HCL snippet (or JSON patch) that fixes the problem.
   - The fix should be copy-paste ready if possible.
   - Focus on the specific resource block corrections.

SCORING RUBRIC (Start at 100):
- CRITICAL (-15): Public access 0.0.0.0/0, Data loss risk, Keys in code, Admin IAM.
- HIGH (-10): Legacy hardware, Default VPC, HTTP traffic, Hardcoded secrets.
- MEDIUM (-5): Minor optimization.
- LOW/INFO (-0): Best practice notes.

STRICT PRICING RULE: DO NOT provide dollar amounts.

Output Requirements:
- Return ONLY valid JSON.
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
        temperature: 0.1, // Low temp for consistent scoring
        seed: 42,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "A score from 0 to 100 indicating readiness." },
            summary: { type: Type.STRING, description: "Executive summary of the audit." },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Pillar name" },
                  score: { type: Type.NUMBER, description: "0-100 score" },
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
                  category: { type: Type.STRING, description: "Related Pillar Name" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  remediation: { type: Type.STRING },
                  fix: { type: Type.STRING, description: "Terraform HCL code snippet to fix the issue. Required for Critical/High issues." },
                  compliance: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of related compliance controls e.g. CIS 1.1, NIST SC-7" 
                  }
                },
                required: ["severity", "category", "title", "description", "remediation", "id"]
              }
            }
          },
          required: ["overallScore", "summary", "categories", "findings"]
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