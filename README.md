# 🛡️ Deployment Readiness Auditor (DRA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%203.0%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![GCP](https://img.shields.io/badge/Platform-Google%20Cloud-blue.svg)](https://cloud.google.com/)

> **The intelligent "Pre-Apply" layer for Google Cloud Infrastructure.**

The **Deployment Readiness Auditor (DRA)** is a Cloud-native, AI-assisted tool that analyzes infrastructure changes *before* they are deployed. It evaluates Terraform HCL or JSON plans against the **Google Cloud Well-Architected Framework** and international compliance standards.

---

## 📌 Table of Contents
- [📸 Core Interface](#-core-interface)
- [🚀 Key Features](#-key-features)
- [🧠 How It Works](#-how-it-works)
- [🆚 DRA vs. Static Analyzers](#-dra-vs-static-analyzers)
- [🛠️ Tech Stack](#️-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [💻 Quick Start](#-quick-start)
- [☁️ Deployment (Cloud Run)](#️-deployment-google-cloud-run)
- [🛡️ Security & Privacy](#️-security--privacy)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 📸 Core Interface

| **Executive Dashboard** | **Semantic Risk Analysis** |
|:---:|:---:|
| ![Dashboard](https://raw.githubusercontent.com/sztankowski/dra/main/docs/dash.png) | ![Findings](https://raw.githubusercontent.com/sztankowski/dra/main/docs/findings.png) |

---

## 🚀 Key Features

- **5-Pillar WAF Audit**: Deep evaluation of Operational Excellence, Security, Reliability, Performance, and Cost.
- **Project-Level Context**: Upload entire folders to analyze cross-file resource dependencies.
- **FinOps Intelligence**: Real-time monthly savings estimations based on 2024/2025 GCP unit pricing.
- **Compliance Mapping**: Automatic alignment with **CIS GCP Benchmark**, **NIST 800-53**, **GDPR**, and **HIPAA**.
- **Interactive Map**: Mermaid.js-powered architectural diagrams generated dynamically from your code.
- **Remediation Code**: AI-generated Terraform snippets to fix identified vulnerabilities instantly.

---

## 🧠 How It Works

DRA utilizes a **Semantic Analysis Pipeline** rather than simple pattern matching:

1.  **HCL Parsing**: Your infrastructure code is parsed into a structured representation.
2.  **Context Enrichment**: We append file paths, line numbers, and project-level relationships.
3.  **LLM Reasoning**: The enriched data is processed by **Gemini 2.0 Pro** using a specialized system instruction tuned for the Google Cloud Architecture Framework.
4.  **Multi-Standard Mapping**: Logical risks are cross-referenced with a registry of global regulatory controls.
5.  **Output Generation**: Results are returned as structured JSON for the React dashboard.

---

## 🆚 DRA vs. Static Analyzers

| Feature | Static Tools (Checkov, TFLint) | **DRA (AI-Assisted)** |
| :--- | :--- | :--- |
| **Logic Analysis** | Misses cross-resource logic errors | Identifies architectural design flaws |
| **Context** | Generic rules | Environment-aware (Prod vs Dev intent) |
| **Remediation** | Static documentation links | Generates context-aware Terraform fixes |
| **FinOps** | Basic presence checks | Semantic estimation based on unit pricing |

---

## 🛠️ Tech Stack

- **UI**: React 19, Tailwind CSS, Lucide Icons
- **AI**: Google GenAI SDK (`@google/genai`)
- **Viz**: Recharts, Mermaid.js
- **Export**: jsPDF, html2canvas

---

## 📋 Prerequisites

1.  **Google Cloud API Key**: Required for the Gemini API. Obtain one from [Google AI Studio](https://aistudio.google.com/).
2.  **Browser**: Modern evergreen browser with ES6 Module support.

---

## 💻 Quick Start

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/sztankowski/deployment-readiness-auditor.git
cd deployment-readiness-auditor

# Set your API Key
export API_KEY=your_gemini_api_key_here

# Serve locally
npx serve .
```

### 🛡️ Security Note
This application runs entirely in the browser. However, it calls the Gemini API directly.
- **Local Dev**: Safe to use direct keys.
- **Production**: For strict security, consider implementing a lightweight backend proxy (e.g., Cloud Functions or Next.js API routes) to hold the API key and forward requests, preventing key exposure in the client-side bundle.

---

## ☁️ Deployment (Google Cloud Run)

This application is optimized for deployment on Google Cloud Run as a static site.

### 1. Build & Push
```bash
export PROJECT_ID="your-gcp-project-id"
export REPO="dra-repo"
export REGION="us-central1"

gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION

docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app
```

### 2. Deploy
```bash
gcloud run deploy dra-app \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000
```

---

## 🛡️ Security & Privacy

- **Data Locality**: No infrastructure code is stored on any server. Analysis is ephemeral and happens within your browser session.
- **Model Privacy**: We use the professional Gemini API which respects enterprise data privacy standards (data is not used to train public models).
- **Zero-Trust**: No database or backend storage is used. History is strictly in your browser's `localStorage`.

---

## 🗺️ Roadmap

- [ ] **GitHub Action Integration**: Automated PR comments with readiness scores.
- [ ] **Custom Policy Support**: Define organization-specific "Forbidden Patterns".
- [ ] **Multi-Cloud Support**: Azure and AWS Well-Architected engines.
- [ ] **Interactive Remediation**: Apply fixes directly via Cloud Shell integration.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE.md` for more information.

---

> Built with ❤️ for the Google Cloud Community by Damian Sztankowski.  
> *Note: This is an independent tool and is not an official Google product.*
