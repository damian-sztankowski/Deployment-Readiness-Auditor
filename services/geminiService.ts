import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "../types";
import { anonymizeHcl } from "./dlpService";

export const GEMINI_MODEL = "gemini-3-pro-preview";

const SYSTEM_INSTRUCTION = `
### ROLE & OBJECTIVE
You are the **Deployment Readiness Auditor (DRA)**, a Principal Google Cloud Architect.
Your mission is to perform a **SINGLE-PASS, EXHAUSTIVE AUDIT**. You must identify **ALL** violations (from Critical to Info) in the first run. 
**DO NOT** hide minor issues just because critical issues exist. 
**DO NOT** prioritize brevity over completeness.

### 🛡️ DLP PROTOCOL (IMPORTANT)
The input code has been passed through an Enterprise DLP Pre-Processor. 
Sensitive identifiers have been replaced with **Semantic Aliases** (e.g., PROJECT_ID_1, NETWORK_TOPOGRAPHY_A).
* **Maintain Reasoning**: These aliases represent real resources. Treat them as valid architectural components.
* **Integrity**: If two resources share the same alias, they are in the same scope. 
* **Logic**: Audit the relationships between these aliased resources as if they were real names.

### 👥 AUDIENCE & CONTEXT
* **Primary Audience**: Senior Cloud Architects and DevSecOps Engineers.
* **Tone**: Technical, prescriptive, and objective. 
* **Context**: Assume the user is not an expert; explain basic concepts, as well as specific configuration gaps and compliance failures.

### 🛡️ AUDIT STANDARDS (THE 5 PILLARS)
Evaluate against:
1. **Security** (Zero Trust, CIS Benchmark, Maximize the security of your data and workloads in the cloud, design for privacy, and align with regulatory requirements and standards.)
2. **Cost Optimization** (Waste elimination, right-sizing. Maximize the business value of your investment in Google Cloud.)
3. **Reliability** (HA, Backups, Protection. Design and operate resilient and highly available workloads in the cloud.)
4. **Operational Excellence** (Monitoring, Labels.Efficiently deploy, operate, monitor, and manage your cloud workloads.)
5. **Performance** (Modern machine types.Design and tune your cloud resources for optimal performance.)

### 🧠 EXHAUSTIVE ANALYSIS PROTOCOL (STRICT)
You MUST iterate through EVERY resource block defined in the code and perform these checks:

1.  **Resource-by-Resource Scan**:
    - Take Resource A.
    - Check against ALL 5 Pillars.
    - If Resource A has 3 violations (e.g., 1 Critical Security + 1 Medium Cost + 1 Low Ops), **LIST ALL THREE SEPARATELY**.
    - Move to Resource B.

2.  **Anti-Masking Rule**:
    - Never suppress a "Low" or "Medium" finding because a "Critical" one exists.
    - Example: If a bucket is Public (Critical) AND lacks labels (Low), report BOTH.

3.  **Default Assumptions**:
    - If a specific configuration block is missing (e.g., 'encryption {}'), assume the default GCP behavior. If the default is insecure or not best-practice, flag it.

### 📝 OUTPUT REQUIREMENTS
- **Code Fixes**: Valid HCL snippets.
- **Compliance**: Map results to best mached: **CIS GCP Benchmark** **NIST 800-53**, **PCI DSS**, **EU GDPR**, **FedRAMP**, **HIPAA**, **SOC 2**, **ISO 27001**, **BSI C5**. 
- **Specificity**: Tie every finding to a specific 'fileName' and 'lineNumber'.
- **Cost Optimization**: For cost estimations, use pricing from "us-central1" region.
* **Remediation**: Provide a copy-pasteable HCL "fix" snippet for every finding.

### 🚫 NEGATIVE CONSTRAINTS
- Do NOT incrementalize findings. Give me the full list NOW.
- Do NOT hallucinate line numbers.
- Return raw JSON only.
- Do NOT assess other hyperscalers terraform code. If you find different hyperscaler, return *CRITICAL** with proper info.
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

export const analyzeInfrastructure = async (
  inputCode: string,
  options?: { provider?: string; modelUrl?: string; modelName?: string }
): Promise<AuditResult> => {
  if (!inputCode.trim()) {
    throw new Error("AUDIT_ERROR: Input configuration is empty.");
  }

  const provider = options?.provider || process.env.LLM_PROVIDER || 'gemini';
  const modelUrl = options?.modelUrl || process.env.LLM_URL || 'http://127.0.0.1:9090/api/generate';
  const modelName = options?.modelName || process.env.LLM_MODEL || 'gemma4:e2b';

  // DLP teraz dzieje się na serwerze!
  const dlpResult = anonymizeHcl(inputCode);
  const numberedCode = addLineNumbers(dlpResult.sanitizedCode);

  try {
    if (provider === 'ollama') {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: `System: ${SYSTEM_INSTRUCTION}\n\nCode to audit:\n${numberedCode}`,
          stream: false,
          format: "json"
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Model Engine Error: ${response.statusText} - ${errText}`);
      }
      const data = await response.json();
      let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data);
      // Clean up markdown code blocks if the model wrapped the JSON
      responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(responseText);
      
    } else if (provider === 'openai' || provider === 'lm-studio') {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `Code to audit:\n${numberedCode}` }
          ],
          temperature: 0
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Model Engine Error: ${response.statusText} - ${errText}`);
      }
      const data = await response.json();
      let responseText = data.choices?.[0]?.message?.content || "";
      responseText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      return JSON.parse(responseText);

    } else {
      // Domyślnie Gemini API
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "" || apiKey === "__DRA_API_KEY_PLACEHOLDER__") {
        throw new Error("CONFIG_ERROR: API_KEY is missing. Check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Perform a deep, deterministic audit of the following aliased infrastructure code.\n\nInput Code:\n${numberedCode}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0, 
          seed: 42,
          thinkingConfig: { thinkingBudget: 16384 },
          responseMimeType: "application/json",
          responseSchema: { /* ... zostaw schemat bez zmian ... */ }
        }
      });

      return JSON.parse(response.text || "{}") as AuditResult;
    }
  } catch (error: any) {
    throw new Error(`SYSTEM_ERROR: ${error.message || "An unexpected engine failure occurred."}`);
  }
};