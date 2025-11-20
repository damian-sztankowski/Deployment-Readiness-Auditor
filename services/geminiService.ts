import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the Deployment Readiness Auditor (DRA), an expert Cloud Architect and Security Specialist.

Your Goal: Analyze the provided Infrastructure-as-Code (Terraform) or Google Cloud configuration (JSON) against the 5 Pillars of the Google Cloud Architecture Framework.

The 5 Pillars:
1. Operational Excellence
2. Security
3. Reliability
4. Performance Efficiency
5. Cost Optimization (Qualitative analysis only, no specific pricing calculations)

SCORING RUBRIC (Start at 100):
- CRITICAL finding: -15 points (e.g., Public access 0.0.0.0/0, Data loss risk, Service Account Keys in code).
- HIGH finding: -10 points (e.g., Legacy hardware n1/f1, Default VPC usage, HTTP traffic).
- MEDIUM finding: -5 points.
- LOW/INFO: -0 points.

LOGIC:
1. Identify added/modified resources.
2. Evaluate against best practices for each pillar.
3. Generate a summary and detailed findings.
4. Calculate category scores and overall score.

Output Requirements:
- Return ONLY valid JSON.
- 'categories' must contain exactly 5 items.
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
                  remediation: { type: Type.STRING }
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