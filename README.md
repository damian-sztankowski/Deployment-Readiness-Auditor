<div align="center">
  <h1 align="center">✨ Deployment Readiness Auditor (DRA)✨</h1>
  <p>
    <strong>
      <a href="https://dra.damiansztankowski.cloud/">🔴 View Live Demo</a>
    </strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" />
    <img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" />
    <img src="https://img.shields.io/badge/AI-Powered%20by%20Gemini-blue?style=for-the-badge&logo=google-gemini&logoColor=white" />
    <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20%26%20AI-red?style=for-the-badge" />
  </p>
</div>

<details>
<summary><strong>⚠️ Disclaimer: AI Usage, Costs, and Data Privacy (Click to read)</strong></summary>

### 2. AI & Generative Content Warning
This tool utilizes Artificial Intelligence (e.g., Azure OpenAI, LLMs) to generate text, code, or images.

* **Accuracy:** AI models can hallucinate or produce inaccurate information. Output should never be treated as absolute fact.
* **Verification:** Users must independently verify all AI-generated content before using it in production environments.
* **Bias:** The model may reflect biases present in its training data. The authors of this repository are not responsible for the nature of the generated content.

### 3. Cost & Billing
This project requires access to cloud services (e.g., Azure AI Studio, Google Cloud Storage, OpenAI API).

* **User Responsibility:** You are solely responsible for all costs incurred by your cloud provider accounts while running this software.
* **Resource Management:** It is the user's responsibility to monitor usage and set up budget alerts. The authors are not liable for unexpected cloud bills or "runaway" processes.

### 4. Data Privacy & External Links
* **Third-Party Storage:** Some assets in this documentation (images/PDFs) are hosted on external object storage (Google Cloud Storage). Availability of these assets is not guaranteed.
* **Sensitive Data:** Do not input sensitive personal data (PII), API keys, or credentials directly into the code or prompt inputs unless you have secured the environment.

</details>

---

**Architect with Confidence. Audit with Intelligence.**

The **Deployment Readiness Auditor (DRA)** is a Google Cloud-native, AI-assisted platform designed to analyze infrastructure-as-code (Terraform/HCL) before it hits production. It evaluates your deployment specification against the official **Google Cloud Well-Architected Framework** and maps risks to global regulatory standards like **NIST, CIS, GDPR, and HIPAA**.

---

## 🌟 Key Features

- **Dual-Analysis Engine**: Simultaneously evaluates Architecture Best Practices and Regulatory Compliance.
- **FinOps Intelligence**: Specifically identifies cost-saving opportunities with estimated monthly reclaimable budget.
- **Auto-Remediation**: Generates precise HCL/Terraform code snippets to fix identified vulnerabilities.
- **Professional Reporting**: Export comprehensive PDF audit briefs for stakeholders and security teams.
- **Semantic Understanding**: Uses Gemini 3 Pro to understand architectural *intent*, not just syntax.

---

## 📋 Prerequisites

Before you begin, ensure you have the following:

1.  **Google Gemini API Key**: Obtain one from the [Google AI Studio](https://aistudio.google.com/).
2.  **Node.js & NPM**: Installed on your local machine (v18+ recommended).
3.  **GCP Project** (Optional for deployment): A project with billing enabled for Cloud Run.

---

## 1. 💻 Local Development

Follow these exact steps to get the app running on your laptop:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/deployment-readiness-auditor.git
cd deployment-readiness-auditor
```

### 2. Install and Build
```bash
npm install
npm run build
```
This converts the `index.tsx` file into a browser-readable `index.js` file using **esbuild**.

### 3. Start the Development Server

#### Option A: Running with Google Gemini (Default)
```bash
API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE npm start
```

#### Option B: Running with a Local Self-Hosted LLM (e.g. LM Studio / Ollama)
You can configure the backend engine to default to a local/self-hosted model using environment variables:
```bash
# For LM Studio (OpenAI Compatible):
LLM_PROVIDER=lm-studio \
LLM_MODEL=gemma \
LLM_URL=http://127.0.0.1:9090/v1/chat/completions \
npm start

# For Ollama:
LLM_PROVIDER=ollama \
LLM_MODEL=gemma4:e2b \
LLM_URL=http://localhost:11434/api/generate \
npm start
```
The terminal will provide a URL (usually `http://localhost:8080`). Open it in your browser! You can also customize your provider, model name, and endpoint URL dynamically in the web UI by clicking the **Gear icon (Settings)** next to the "Run Audit" button.

---

## 🛠️ Command Line Interface (CLI)

The **DRA CLI (`dra-cli`)** lets you scan Terraform infrastructure files directly from your terminal or CI/CD pipelines.

### 1. Build and Install
Compile the standalone Go binary from the project workspace:
```bash
# Build the binary locally in ./dra-cli/bin/dra-cli
make -C dra-cli build

# Or build and install it to your system Go bin path
make -C dra-cli install
```

### 2. Add to PATH
Add the compiled binary directory to your current terminal environment:
```bash
export PATH=$PATH:$(pwd)/dra-cli/bin
```
*(Add this line to your `~.zshrc` or `~/.bashrc` to make it persistent across terminal sessions)*

### 3. Running Scans
Execute the audit against any folder containing `.tf` files:

#### Auditing with Gemini API (requires GCP_IAM_TOKEN env if deployed on GCP Cloud Run)
```bash
# Standard local scan
./dra-cli/bin/dra-cli scan --path /path/to/terraform/code

# Scanning recursively into all subdirectories
./dra-cli/bin/dra-cli scan --path /path/to/terraform/code --deep-scan
```

#### Auditing with Local Self-Hosted LLMs (bypasses GCP authorization checks)
```bash
# Auditing via local LM Studio:
./dra-cli/bin/dra-cli scan \
  --path /path/to/terraform/code \
  --llm-provider lm-studio \
  --llm-model gemma-4-12b \
  --llm-url http://127.0.0.1:9090/v1/chat/completions

# Auditing via local Ollama:
./dra-cli/bin/dra-cli scan \
  --path /path/to/terraform/code \
  --llm-provider ollama \
  --llm-model gemma4:e2b \
  --llm-url http://localhost:11434/api/generate
```

### 🎨 Branded Console Polish
The CLI features a premium console output interface:
* **Interactive Loading Spinner**: Displays live activity indicators during audit evaluation.
* **Audit Run Dashboard**: Shows counts of scanned files alongside totals for Critical, High, Medium, and Low vulnerabilities.
* **Visual Progress Bars**: Draws horizontal bar charts (e.g. `████████░░░░ 70/100`) mapped to pillar security score metrics.
* **Boxed Findings**: Packages and aligns vulnerability descriptions, locations, and suggested HCL remediation code inside clean border cards.
* **ANSI Colored Help Screens**: View colorized option descriptions and flags by running `dra-cli scan --help`.

---

## ☁️ Deployment to Google Cloud Run

> [!TIP]
> Cloud Run is the best way to host DRA. It's serverless, scales to zero, and highly secure.

### 1. Build and Deploy in One Command
If you want to change your model, open the `services/geminiService.ts` file in the root directory. Look for this block:
```javascript
export const GEMINI_MODEL = "gemini-3-pro-preview";
```

Then run this command to deploy solution on Cloud Run.
```bash
gcloud run deploy dra-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
  --set-env-vars API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE \
```

> [!TIP]
> If you want only show capabilities of this tool, you don't have to provide ``API_KEY``. Simply ommit ``--set-env-vars API_KEY=`` and application will be deployed in showcase mode.

### 2. Access the App
Once finished, the command output will provide a **Service URL**. Click it to access your live Deployment Readiness Auditor!


---

## 🛠️ How to Use

1.  **Input**: Paste your `.tf` or `.tfvars` code into the "Deployment Specification" editor. You can also update entire directory.
2.  **Analyze**: Click **Run Global Audit**.
3.  **Review**: 
    - Use the **Pillar Matrix** to see which area needs most attention.
    - Check the **FinOps Opportunities** section for quick budget wins.
    - Click any **Standard Tag** (e.g., NIST 800-53 AC-3) to see the formal regulatory requirement and business impact.
4.  **Remediate**: Expand findings to see the **Terraform Change** and copy the fix directly into your source code.
5.  **Report**: Click **Export Professional Audit** to generate a PDF for your compliance record.

### 📸 Gallery
<p align="center">
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/splash-page.png" width="400" />
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/scan-infra.png" width="400" />
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/running-analysis.png" width="400" />
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/summary.png" width="400" />
</p>

<p align="center">
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/key-findings.png" width="400" />
  <img src="https://storage.googleapis.com/gh-repo-media-files/images/model-info.png" width="400" />
</p>

### 📄 Project Report
Report example and analysis can be found here:
[**Download / View Project Report (PDF)**](https://storage.googleapis.com/gh-repo-media-files/examples/reports/DRA_Enterprise_Audit_1767377273234.pdf)

---

## 🔒 Security & Privacy

- **No Persistence**: DRA does not store your code. Infrastructure analysis is ephemeral and exists only in memory during the execution phase.
- **Hybrid API Proxy Architecture**: To safeguard API credentials, the browser UI routes all analyses through a local backend proxy (`/api/audit`), ensuring Google Gemini API keys are never exposed to client bundles or browser consoles.
- **Enterprise-Grade DLP Engine**: Implements a semantic data loss prevention engine before sending code payloads to any LLM provider.
  - Automatically sanitizes identities (emails), VPC/IP topographies, database names, and billing/GCP project resource identifiers into semantic aliases (e.g. `IP_RANGE_1`, `CLOUD_ID_2`).
  - Implements **Global High-Entropy Scanning** to scrub hardcoded credentials (such as Google API keys `AIzaSy...`, AWS Access Key IDs `AKIA...`, and PEM private key files) even if assigned to generic attribute names (like `value = "..."`).
- **SSRF Outbound Protection**: In production and container environments (such as Cloud Run), the LLM routing proxy strictly validates external target URLs to prevent Server-Side Request Forgery (SSRF). Attempts to access internal subnets, local loopbacks, or the GCP Link-Local Instance Metadata Server (`169.254.169.254`) are intercepted and blocked.
- **Vulnerability Isolation**: Local developer options remain active for offline environments, allowing loopback requests to local Ollama (`localhost:11434`) or LM Studio endpoints only when not executing in production or containerized environments.
- **Zero-Knowledge Storage**: Audit history logs are preserved locally inside the client browser's `localStorage` and are never synced to any remote database.

---


## 📄 License

Distributed under the MIT License. See `LICENSE.md` for more information.

---
<p align="center">
  <a href="https://github.com/your-github-username">
    <img src="https://img.shields.io/badge/Architected%20by-Damian%20Sztankowski-blue?style=for-the-badge&logo=github" alt="Damian Sztankowski" />
  </a>
</p>

> [!NOTE]
> **Independent Tool**: This project is a community contribution and is not officially endorsed or maintained by Google.
---
