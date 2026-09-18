import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, GEMINI_MODEL } from "../types";
import { anonymizeHcl } from "./dlpService";
import dns from 'dns/promises';
import { isIP } from 'net';

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
- **Topology Diagram**: In the 'diagram' field, provide a clean, valid Mermaid flowchart (using flowchart TD or flowchart LR) illustrating the audited architecture, resource relations (networks, subnets, instances, databases, buckets, firewalls), and highlight critical risks with descriptive node labels. Do not use markdown backticks or html in the diagram string.

### 📄 TERRAFORM PLAN SUPPORT (tfplan.json)
The input code may be standard HCL (.tf) OR a Terraform Plan JSON (tfplan.json / terraform show -json).
If the input is a Terraform Plan JSON:
- Inspect the 'resource_changes' array, analyzing change actions (e.g. create, update, delete).
- Evaluate the 'change.after' configuration against the 5 Architecture Pillars.
- For finding locations, reference the resource address (e.g. google_compute_instance.vm_instance) as the fileName if no physical file name is present.
- Provide the remediated HCL fix snippet for the flagged resource.

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

const extractJson = (text: string): string => {
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return text.substring(firstOpen, lastClose + 1);
  }
  return text.trim();
};

const sanitizeAuditResult = (data: any): AuditResult => {
  const result: AuditResult = {
    summary: typeof data?.summary === 'string' ? data.summary : 'No summary provided by the audit engine.',
    categories: Array.isArray(data?.categories) ? data.categories : [],
    findings: Array.isArray(data?.findings) ? data.findings : [],
    diagram: typeof data?.diagram === 'string' && data.diagram.trim().length > 0 ? data.diagram.trim() : undefined
  };

  // Ensure each category has valid format
  result.categories = result.categories.map((c: any) => ({
    name: typeof c?.name === 'string' ? c.name : 'Unknown Pillar',
    score: typeof c?.score === 'number' ? c.score : 100,
    status: c?.status === 'Safe' || c?.status === 'Warning' || c?.status === 'Critical' ? c.status : 'Safe',
    explanation: typeof c?.explanation === 'string' ? c.explanation : ''
  }));

  // Ensure each finding has valid format
  result.findings = result.findings.map((f: any) => ({
    id: typeof f?.id === 'string' ? f.id : Math.random().toString(36).substring(2, 9),
    severity: f?.severity === 'Critical' || f?.severity === 'High' || f?.severity === 'Medium' || f?.severity === 'Low' || f?.severity === 'Info' ? f.severity : 'Info',
    category: typeof f?.category === 'string' ? f.category : 'General',
    title: typeof f?.title === 'string' ? f.title : 'Architectural Issue',
    description: typeof f?.description === 'string' ? f.description : '',
    remediation: typeof f?.remediation === 'string' ? f.remediation : 'Review configuration.',
    fix: typeof f?.fix === 'string' ? f.fix : '',
    fileName: typeof f?.fileName === 'string' ? f.fileName : 'main.tf',
    lineNumber: typeof f?.lineNumber === 'number' ? f.lineNumber : 1,
    costSavings: typeof f?.costSavings === 'string' ? f.costSavings : '',
    compliance: Array.isArray(f?.compliance) ? f.compliance.map((comp: any) => ({
      standard: typeof comp?.standard === 'string' ? comp.standard : 'CIS GCP Benchmark',
      controlId: typeof comp?.controlId === 'string' ? comp.controlId : '',
      description: typeof comp?.description === 'string' ? comp.description : '',
      impact: typeof comp?.impact === 'string' ? comp.impact : ''
    })) : []
  }));

  return result;
};

const isPrivateIp = (ip: string): boolean => {
  let cleanIp = ip.trim().toLowerCase();

  // Normalize IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1)
  if (cleanIp.startsWith('::ffff:')) {
    const mapped = cleanIp.substring(7);
    if (isIP(mapped) === 4) {
      cleanIp = mapped;
    }
  }

  if (cleanIp.startsWith('0.')) return true;
  if (cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) return true;
  if (cleanIp.startsWith('127.')) return true;
  if (cleanIp.startsWith('169.254.')) return true;

  if (cleanIp.startsWith('172.')) {
    const parts = cleanIp.split('.');
    if (parts.length === 4) {
      const p2 = parseInt(parts[1], 10);
      if (p2 >= 16 && p2 <= 31) return true;
    }
  }

  if (
    cleanIp === '::1' ||
    cleanIp === '::' ||
    cleanIp.startsWith('fc00:') ||
    cleanIp.startsWith('fd00:') ||
    cleanIp.startsWith('fe80:')
  ) {
    return true;
  }

  return false;
};

interface ValidatedUrlResult {
  url: string;
  hostHeader?: string;
}

const resolveAndValidateUrl = async (urlStr: string): Promise<ValidatedUrlResult> => {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    
    // Always block local/GCP metadata server and standard loopbacks/internals
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata' ||
      hostname === 'localhost' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      throw new Error("SECURITY_ERROR");
    }

    let resolvedIp: string;

    if (isIP(hostname)) {
      resolvedIp = hostname;
    } else {
      try {
        const lookupResults = await dns.lookup(hostname, { all: true });
        if (!lookupResults || lookupResults.length === 0) {
          throw new Error("SECURITY_ERROR");
        }
        // Validate all resolved IP addresses to prevent SSRF
        for (const res of lookupResults) {
          if (isPrivateIp(res.address)) {
            throw new Error("SECURITY_ERROR");
          }
        }
        // Use the first resolved IP
        resolvedIp = lookupResults[0].address;
      } catch {
        throw new Error("SECURITY_ERROR"); // Safe fallback: block if resolution fails
      }
    }

    if (isPrivateIp(resolvedIp)) {
      throw new Error("SECURITY_ERROR");
    }

    // For HTTP, rewrite URL to use resolved IP to prevent DNS rebinding
    if (url.protocol === 'http:') {
      const originalHost = url.host; // includes port if present
      
      const rewrittenUrl = new URL(urlStr);
      rewrittenUrl.hostname = resolvedIp.includes(':') ? `[${resolvedIp}]` : resolvedIp;
      
      return {
        url: rewrittenUrl.toString(),
        hostHeader: originalHost
      };
    }

    // For HTTPS, do not rewrite to IP to prevent SSL/TLS handshake failures,
    // as SSL/TLS verification itself prevents DNS rebinding attacks.
    return {
      url: urlStr
    };
  } catch (err: any) {
    throw new Error("SECURITY_ERROR: Access to the specified LLM URL is restricted.");
  }
};

const isPrivateUrl = async (urlStr: string): Promise<boolean> => {
  try {
    await resolveAndValidateUrl(urlStr);
    return false;
  } catch {
    return true;
  }
};

export const analyzeInfrastructure = async (
  inputCode: string,
  options?: { provider?: string; modelUrl?: string; modelName?: string }
): Promise<AuditResult> => {
  if (!inputCode.trim()) {
    throw new Error("AUDIT_ERROR: Input configuration is empty.");
  }

  const provider = options?.provider || process.env.LLM_PROVIDER || 'gemini';
  let modelUrl = options?.modelUrl || process.env.LLM_URL || 'http://127.0.0.1:9090/api/generate';
  const modelName = options?.modelName || process.env.LLM_MODEL || 'gemma4:e2b';

  const extraHeaders: Record<string, string> = {};

  // Mitigate SSRF: Validate client-provided modelUrl
  if (options?.modelUrl) {
    const validated = await resolveAndValidateUrl(options.modelUrl);
    modelUrl = validated.url;
    if (validated.hostHeader) {
      extraHeaders['Host'] = validated.hostHeader;
    }
  }

  // DLP teraz dzieje się na serwerze!
  const dlpResult = anonymizeHcl(inputCode);
  const numberedCode = addLineNumbers(dlpResult.sanitizedCode);

  try {
    if (provider === 'ollama') {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...extraHeaders
        },
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
      console.log("[OLLAMA RAW RESPONSE]", responseText);
      const cleaned = extractJson(responseText);
      const result = sanitizeAuditResult(JSON.parse(cleaned));
      result.model = modelName;
      result.provider = provider;
      return result;

    } else if (provider === 'openai' || provider === 'lm-studio') {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...extraHeaders
        },
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
      console.log("[LM STUDIO RAW RESPONSE]", responseText);
      const cleaned = extractJson(responseText);
      const result = sanitizeAuditResult(JSON.parse(cleaned));
      result.model = modelName;
      result.provider = provider;
      return result;

    } else {
      // Domyślnie Gemini API
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "" || apiKey === "__DRA_API_KEY_PLACEHOLDER__") {
        throw new Error("CONFIG_ERROR: API_KEY is missing. Check your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = options?.modelName || process.env.LLM_MODEL || GEMINI_MODEL;
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: `Perform a deep, deterministic audit of the following aliased infrastructure code.\n\nInput Code:\n${numberedCode}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0,
          seed: 42,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              diagram: { type: Type.STRING },
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

      const result = sanitizeAuditResult(JSON.parse(response.text || "{}"));
      result.model = targetModel;
      result.provider = provider;
      
      if (response.usageMetadata) {
        result.usage = {
          promptTokenCount: response.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: response.usageMetadata.candidatesTokenCount || 0,
          totalTokenCount: response.usageMetadata.totalTokenCount || 0
        };
      }
      
      return result;
    }
  } catch (error: any) {
    throw new Error(`SYSTEM_ERROR: ${error.message || "An unexpected engine failure occurred."}`);
  }
};