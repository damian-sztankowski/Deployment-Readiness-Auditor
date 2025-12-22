import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect and FinOps Controller. 
Your goal is to conduct a **merciless, deep-dive audit** of Infrastructure-as-Code (Terraform/HCL) against the **Google Cloud Architecture Framework**.

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
You must evaluate the code against these exact pillars:
1.  **Security**: Maximize the security of your data and workloads in the cloud, design for privacy, and align with regulatory requirements and standards. 
2.  **Cost Optimization**: Identify idle resources, over-provisioning, expensive regions, and detached disks. Assume 'us-central1' pricing. Maximize the business value of your investment in Google Cloud.
3.  **Reliability**: Design and operate resilient and highly available workloads in the cloud.
4.  **Operational Excellence**: Efficiently deploy, operate, monitor, and manage your cloud workloads.
5.  **Performance**: Right-sizing, caching, CDN usage. Design and tune your cloud resources for optimal performance.

### 🧠 ANALYSIS LOGIC (STEP-BY-STEP)
1.  **Scan**: Identify all resources. Map them to provided filenames and line numbers.
2.  **Detect**: Find violations. If a resource looks "default", assume it's insecure until proven otherwise.
3.  **Score**: 
    - Start at 100%. 
    - **Critical** (-20%): Data leak risk, public access, root keys.
    - **High** (-10%): Missing encryption, no backups.
    - **Medium** (-5%): Missing labels, logs.
    - **Low/Info** (-1%): Best practices.
4.  **Remediate**: Generate precise HCL code fixes.

### 📝 OUTPUT REQUIREMENTS (STRICT)
- **Code Fixes**: MUST be valid HCL snippets. Do not just say "enable encryption". Show the exact block: \`encryption { kms_key_name = "..." }\`.
- **Compliance**: Map findings to the most relevant **CIS GCP Benchmark** or **NIST 800-53** or **EU GDPR** or **FedRAMP** or **HIPAA** or **SOC2** or **PCI DSS** or **ISO27001** or **BSI C5**.
    - *Format*: "CIS 5.2 - Log metric filter and alert for VPC Network Firewall rule changes".
    - *Impact*: Explain the SPECIFIC business risk (e.g., "Potential for undetected lateral movement").
- **Cost Savings**: Estimate monthly savings in USD (e.g., "Save ~$120/mo by switching to e2-micro").
- **Specificity**: Never return generic findings. Tie every finding to a specific resource name (e.g., "google_storage_bucket.data_lake").

### 🚫 NEGATIVE CONSTRAINTS
- Do NOT hallucinate line numbers. If unsure, use the resource definition line.
- Do NOT be polite. Be professional, concise, and technical.
- Do NOT wrap the JSON output in markdown blocks. Return raw JSON only.
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
      contents: `Perform a deep audit. You MUST provide structured 'compliance' info for every finding including controlId, formal description, and impact. Provide a 'fix' code snippet for every finding. Identify exact file names and line numbers.\n\nInput Code:\n${numberedCode}`,
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

    const result = JSON.parse(response.text) as AuditResult;
    
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