# Deployment Readiness Auditor (DRA)

The **Deployment Readiness Auditor (DRA)** is a Google Cloud-native, AI-powered audit engine designed to analyze infrastructure-as-code (Terraform HCL or JSON) against the **Google Cloud Architecture Framework**.

Leveraging **Gemini 3 Pro**, DRA provides semantic analysis of your cloud resources, identifying security vulnerabilities, cost-saving opportunities, and reliability gaps before you run `terraform apply`.

## 📸 Core Interface

| Executive Dashboard | Semantic Risk Analysis |
|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Findings](docs/screenshots/findings.png) |

| AI Architecture Mapping | FinOps Optimization |
|:---:|:---:|
| ![Map](docs/screenshots/map.png) | ![Cost](docs/screenshots/cost.png) |

## 🚀 Key Features

- **GCP-Native Intelligence**: Strictly optimized for Google Cloud Platform services.
- **Terraform Semantic Parsing**: Understands HCL relationships, not just syntax. Supports single files and **entire project folders**.
- **5-Pillar Audit**: comprehensive scoring based on:
    - **Operational Excellence**: Logging, monitoring, and deployment standards.
    - **Security**: IAM least-privilege, network hardening, and encryption.
    - **Reliability**: High Availability (HA) and Disaster Recovery (DR) posture.
    - **Performance Efficiency**: Right-sizing and modern resource selection.
    - **Cost Optimization**: Quantitative FinOps analysis with estimated monthly savings.
- **AI Architecture Map**: Generates interactive Mermaid.js diagrams of your proposed infrastructure.
- **Compliance Alignment**: Maps risks to standard frameworks like **CIS GCP Benchmark**, **NIST 800-53**, and **HIPAA**.
- **Professional Reporting**: Export high-fidelity PDF reports for stakeholders.
- **Privacy First**: Analysis is ephemeral. Your code is processed in-memory and never persisted.

## 🆚 Why AI-Powered Auditing?

DRA goes beyond static analysis (regex-based tools) by understanding the *intent* and *context* of your architecture.

| Feature | Static Analyzers (Checkov, TFLint) | DRA (AI-Assisted) |
| :--- | :--- | :--- |
| **Logic Analysis** | Misses cross-resource logic errors | Identifies architectural design flaws |
| **Context** | Generic rules | Environment-aware (Prod vs Dev intent) |
| **Remediation** | Static documentation links | Generates context-aware Terraform code fixes |
| **FinOps** | Hard to calculate complex savings | Semantic estimation based on latest GCP pricing |

## 🛠️ Tech Stack

- **Frontend**: React 19 (ES6 Modules)
- **Styling**: Tailwind CSS
- **AI Engine**: Google GenAI SDK (`@google/genai`) using `gemini-3-pro-preview`
- **Visualization**: Recharts & Mermaid.js
- **Reporting**: `jspdf` & `html2canvas`

## 📋 Prerequisites

1.  **Google Cloud API Key**: Required for the Gemini API.
    -   Generate a key at [Google AI Studio](https://aistudio.google.com/).
    -   Ensure the key has access to `gemini-3-pro-preview`.

## 💻 Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/deployment-readiness-auditor.git
    cd deployment-readiness-auditor
    ```

2.  **Environment Setup**
    The application reads the API key from `process.env.API_KEY`.
    ```bash
    export API_KEY=your_gemini_api_key_here
    ```

3.  **Launch**
    Since the project uses ES6 modules directly in the browser via import maps, you can serve it with any static file server:
    ```bash
    npx serve .
    ```

## 🛡️ Security Note
This application runs entirely in the browser. However, it calls the Gemini API directly.

**Local Dev:** Safe to use direct keys.
**Production:** For strict security, consider implementing a lightweight backend proxy (e.g., Cloud Functions or Next.js API routes) to hold the API key and forward requests, preventing key exposure in the client-side bundle.

## ☁️ Deployment (Google Cloud Run)
This application is optimized for deployment on Google Cloud Run as a static site served via Nginx.

### 1. Create Dockerfile
Ensure you have a Dockerfile in the root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "serve", "-s", "dist" ]
```

### 2. Build & Push
```bash
export PROJECT_ID="your-gcp-project-id"
export REPO="dra-repo"
export REGION="us-central1"

gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION

docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app
```

### 3. Deploy
```bash
gcloud run deploy dra-app \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/dra-app \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000
```

## 🛡️ Security & Privacy

- **Data Locality**: The app runs in your browser. Code snippets are sent directly to the Gemini API.
- **No Persistence**: This tool does not have a database. Your audit history is stored in your browser's `localStorage` only.
- **Encrypted Transit**: All API calls are made over HTTPS.

## 📄 License

This project is released under the **MIT License**.

> **Note**: Deployment Readiness Auditor is an independent tool and is not an official Google Cloud product. Built for the community by Damian Sztankowski.
