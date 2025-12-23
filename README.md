# 🛡️ Deployment Readiness Auditor (DRA)

<p align="left">
  <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Powered%20by%20Gemini-blue?style=for-the-badge&logo=google-gemini&logoColor=white" />
  <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20%26%20AI-red?style=for-the-badge" />
</p>

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

### 2. Change LLM Model
If you want to change your model, open the `services/geminiService.ts` file in the root directory. Look for this block:
```javascript
export const GEMINI_MODEL = "gemini-3-pro-preview";
```

### 3. Install and Build
```bash
npm install
npm run build
```
This converts the `index.tsx` file into a browser-readable `index.js` file using **esbuild**.

### 4. Start the Development Server
```bash
API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE npm start
```
The terminal will provide a URL (usually `http://localhost:8080`). Open it in your browser!

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
> If you want only present capabilities of this tool, you don't have to provide ``API_KEY``. Simply ommit ``--set-env-vars API_KEY=`` and application will be deployed in showcase mode.

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
[**Download / View Project Report (PDF)**](https://storage.googleapis.com/gh-repo-media-files/examples/reports/DRA_Enterprise_Audit_1766410688554.pdf)

---

## 🔒 Security & Privacy

- **No Persistence**: DRA does not store your code. Analysis is ephemeral and exists only during your session.
- **Client-Side Processing**: The UI runs entirely in your browser. Code is sent securely via HTTPS to the Gemini API for analysis.
- **Zero-Knowledge**: No database is used. History is stored in your browser's `localStorage`.

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