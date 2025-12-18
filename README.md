# 🛡️ Deployment Readiness Auditor (DRA) v2.5

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

## 💻 Local Development (Idiot-Proof Guide)

Follow these exact steps to get the app running on your laptop:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/deployment-readiness-auditor.git
cd deployment-readiness-auditor
```

### 2. Configure your API Key
Open the `index.html` file in the root directory. Look for this block:
```javascript
// Shim for process.env used by @google/genai
window.process = {
  env: {
    API_KEY: "PASTE_YOUR_GEMINI_API_KEY_HERE" 
  }
};
```
*Note: In a production environment, you should use environment variables. For local testing, this is the fastest way.*

### 3. Install and Build
```bash
npm install
npm run build
```
This converts the `index.tsx` file into a browser-readable `index.js` file using **esbuild**.

### 4. Start the Development Server
```bash
npm start
```
The terminal will provide a URL (usually `http://localhost:3000`). Open it in your browser!

---

## ☁️ Deployment to Google Cloud Run

Cloud Run is the best way to host DRA. It's serverless, scales to zero, and highly secure.

### 1. Build and Deploy in One Command
Replace `[PROJECT_ID]` with your actual Google Cloud Project ID. This command uses the provided `Dockerfile` to bundle and serve your app automatically.

```bash
gcloud run deploy dra-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars API_KEY=your_actual_gemini_key_here \
  --port 3000
```

### 2. Access the App
Once finished, the command output will provide a **Service URL**. Click it to access your live Deployment Readiness Auditor!

---

## 🛠️ How to Use

1.  **Input**: Paste your `.tf` or `.tfvars` code into the "Deployment Specification" editor.
2.  **Analyze**: Click **Run Global Audit**.
3.  **Review**: 
    - Use the **Pillar Matrix** to see which area needs most attention.
    - Check the **FinOps Opportunities** section for quick budget wins.
    - Click any **Standard Tag** (e.g., NIST 800-53 AC-3) to see the formal regulatory requirement and business impact.
4.  **Remediate**: Expand findings to see the **Terraform Change** and copy the fix directly into your source code.
5.  **Report**: Click **Export Professional Audit** to generate a PDF for your compliance record.

---

## 🔒 Security & Privacy

- **No Persistence**: DRA does not store your code. Analysis is ephemeral and exists only during your session.
- **Client-Side Processing**: The UI runs entirely in your browser. Code is sent securely via HTTPS to the Gemini API for analysis.
- **Zero-Knowledge**: No database is used. History is stored in your browser's `localStorage`.

---

## 📄 License

Distributed under the MIT License. See `LICENSE.md` for more information.

**Disclaimer**: *This tool provides AI-generated architectural advice. Always perform a manual review of infrastructure changes before applying them to production environments.*