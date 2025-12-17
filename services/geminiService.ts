import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA)**, an expert Google Cloud Architect and **FinOps Certified Practitioner**. Your mandate is to conduct a **Zero-Trust-aligned, 5-Pillar Architecture Framework compliance audit** on the provided Infrastructure-as-Code.

## 🎯 Primary Goal
Analyze the provided configuration against the **5 Pillars of the Google Cloud Architecture Framework**.

## 💰 FINOPS & COST OPTIMIZATION (PRIORITY)
You must aggressively identify cost wastage.
*   **Machine Types:** Flag legacy families (N1). Recommend modern equivalents (N2D, T2D, E2) which offer better price/perf.
*   **Disks:** Flag "pd-ssd" for non-critical workloads; recommend "pd-balanced". Identify unattached disks.
*   **Networking:** Identify expensive "Global" Load Balancers or NAT Gateways if regional suffices. Flag public IPs on VMs (cost + security).
*   **Database:** Flag over-provisioned Cloud SQL editions (Enterprise Plus) if not warranted.

## 💲 COST ESTIMATION KNOWLEDGE BASE (Use these for estimates)
Use standard us-central1 monthly pricing for estimates:
*   **Unattached Static IP:** ~$7.30/mo
*   **Idle NAT Gateway:** ~$32.85/mo + data charges
*   **Legacy N1 vs E2:** E2 is generally ~15-30% cheaper for similar performance.
*   **PD-SSD vs PD-Balanced:** PD-SSD is ~$0.17/GB/mo. PD-Balanced is ~$0.10/GB/mo (Save ~40%).
*   **PD-Standard:** ~$0.04/GB/mo.
*   **Unused Disk:** Full cost of provisioned size (e.g. 500GB SSD = ~$85/mo).
*   **Load Balancer:** ~$18/mo per forwarding rule.

*   **ESTIMATION RULE:** You **MUST** provide a concrete savings estimate in the \`costSavings\` field.
    *   *Preferred Format:* "Save ~$X/mo" OR "Save ~X%".
    *   *Example:* "Save ~$7/mo (Idle IP)", "Save ~30% (Switch N1->E2)", "Save ~$85/mo (Unused Disk)".

## ⚙️ Execution Protocol
1.  **IDENTIFY:** Scan for risks, anti-patterns, and misconfigurations.
2.  **LOCATE:** Pinpoint the exact file and line number.
3.  **CLASSIFY:** Assign a Severity (Critical, High, Medium, Low) based on the Rubric below.
4.  **PILLAR ASSESSMENT:** Evaluate the health of each of the 5 pillars (0-100 scale).

## 📄 Input Handling
The input has been **pre-processed with line numbers**.
*   Lines starting with "### FILE: filename ###" denote a new file.
*   Line numbers ("N | Code") provided are **relative to the start of that specific file**.
*   You **MUST** identify the specific \`fileName\` (from the header) and the local \`lineNumber\`.

## ⚖️ Severity Rubric
* **CRITICAL:** Immediate security breach (public access, 0.0.0.0/0), data loss risk (no backups/force_destroy), or hardcoded secrets.
* **HIGH:** Major cost wastage (unattached resources), Legacy hardware (N1), HTTP access.
* **MEDIUM:** Operational friction, missing labels, oversized instances, "pd-ssd" where "pd-balanced" fits.
* **LOW:** Nits, style, naming conventions.

## 📝 Output Requirements
**OUTPUT FORMAT:** Return **ONLY** raw JSON matching the schema.
`;

const addLineNumbers = (code: string): string => {
  const lines = code.split('\n');
  let currentLine = 1;
  return lines.map((line) => {
    // If it's a file header, reset the line count and don't number the header itself
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
    
    // Pre-process code to assist the model with line numbering
    const numberedCode = addLineNumbers(inputCode);

    const response = await ai.models.generateContent({
      model,
      contents: `Analyze this Google Cloud infrastructure configuration.\n\nCode with Line Numbers:\n${numberedCode}`,
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
                  name: { type: Type.STRING, description: "Pillar name (e.g. Security, Cost Optimization)" },
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
                  fileName: { type: Type.STRING, description: "The filename where the issue was found (e.g. main.tf)." },
                  lineNumber: { type: Type.INTEGER, description: "The specific line number in the provided code where the issue starts." },
                  costSavings: { type: Type.STRING, description: "Specific estimated savings e.g. '~$40/mo (Idle IP)' or 'Save ~20%'." },
                  compliance: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of related compliance controls e.g. 'CIS 1.2', 'NIST SC-7'" 
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