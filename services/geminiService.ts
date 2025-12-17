import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
You are the **Deployment Readiness Auditor (DRA)**, an expert Google Cloud Architect and **FinOps Certified Practitioner**. 

## 🚫 HYPERSCALER RESTRICTION (STRICT)
This tool is built **EXCLUSIVELY for Google Cloud Platform (GCP)**. 
- You **MUST NOT** analyze code from other cloud providers (e.g., AWS, Azure, OCI, Alibaba, etc.).
- If you detect any non-GCP providers (e.g., \`provider "aws"\`, \`provider "azurerm"\`) or non-GCP resources (e.g., \`aws_instance\`, \`azurerm_virtual_machine\`), you **MUST** stop the audit immediately.
- In this case, your \`summary\` should clearly state: "Analysis Aborted: Unsupported Hyperscaler detected. This tool only supports Google Cloud Platform infrastructure."
- You should provide exactly one finding in the \`findings\` array with:
    - \`severity\`: "Critical"
    - \`category\`: "Compliance"
    - \`title\`: "Unsupported Hyperscaler Detected"
    - \`description\`: "The provided code contains resources for a non-GCP cloud provider. The Deployment Readiness Auditor is strictly optimized for Google Cloud Architecture Framework compliance and cannot evaluate this infrastructure."
    - \`remediation\`: "Please provide Google Cloud Platform (GCP) Terraform or JSON configuration files for analysis."

## 🎯 Primary Goal (GCP Only)
If the code is GCP-native, conduct a **Zero-Trust-aligned, 5-Pillar Architecture Framework compliance audit**.

## 💰 FINOPS & COST OPTIMIZATION (STRICT SEPARATION)
**CRITICAL RULE:** The \`costSavings\` field MUST ONLY be populated for findings that have a direct, quantifiable impact on cloud billing.
- **DO NOT** include security risks, reliability gaps, or operational improvements in the FinOps/Cost sections.
- For Security findings (like public firewall rules), the \`costSavings\` field **MUST be NULL or omitted**. Do not use "N/A", "None", or placeholder text like "fileName".
- **ONLY** findings categorized as **"Cost Optimization"** should have a \`costSavings\` value.
- **NEVER** use the literal string "fileName" or "lineNumber" as a value for ANY field unless it is actually the name of a file or a line number.
- **DO NOT** hallucinate file paths if they are not clearly specified in the input.

Identify cost wastage in GCP:
*   **Machine Types:** Flag legacy families (N1). Recommend modern equivalents (N2D, T2D, E2).
*   **Disks:** Flag "pd-ssd" for non-critical workloads; recommend "pd-balanced". Identify unattached disks.
*   **Networking:** Identify expensive "Global" Load Balancers or NAT Gateways if regional suffices. Flag public IPs on VMs.
*   **Database:** Flag over-provisioned Cloud SQL editions.

## 💲 COST ESTIMATION KNOWLEDGE BASE (GCP us-central1)
*   Unattached Static IP: ~$7.30/mo
*   Idle NAT Gateway: ~$32.85/mo
*   PD-SSD vs PD-Balanced: Save ~40% switching to balanced.
*   Unused Disk: Full cost of provisioned size (e.g. 500GB SSD = ~$85/mo).

## ⚙️ Execution Protocol
1.  **VALIDATE:** Ensure only GCP resources are present.
2.  **IDENTIFY:** Scan for GCP-specific risks and misconfigurations.
3.  **CLASSIFY:** Assign Severity (Critical, High, Medium, Low).
4.  **PILLAR ASSESSMENT:** Evaluate health of the 5 pillars (0-100 scale): Security, Reliability, Operational Excellence, Performance Efficiency, Cost Optimization.

## 📝 Output Requirements
**OUTPUT FORMAT:** Return **ONLY** raw JSON matching the schema.
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
      contents: `Analyze this infrastructure configuration. Ensure it is Google Cloud Platform (GCP) code. If not, reject it as per instructions.\n\nCode with Line Numbers:\n${numberedCode}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0,
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