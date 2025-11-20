# Deployment Readiness Auditor (DRA)

The **Deployment Readiness Auditor (DRA)** is an AI-powered web application designed to analyze Google Cloud infrastructure configurations (Terraform or JSON) against the **Google Cloud Architecture Framework**.

It leverages Google's **Gemini models** to provide instant, pillar-based scoring, risk detection, and remediation recommendations, helping cloud architects and engineers deploy with confidence.

## 📸 Screenshots

> *Note: To see these images locally, place screenshots in `docs/screenshots/` named as referenced below.*

| Landing Page | Assessment Input |
|:---:|:---:|
| ![Landing Page](docs/screenshots/landing.png) | ![Input Section](docs/screenshots/input.png) |

| Audit Dashboard | PDF Report |
|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![PDF Report](docs/screenshots/report.png) |

## 🚀 Features

-   **AI-Driven Audits**: Uses `gemini-2.5-pro` to parse and analyze Infrastructure-as-Code.
-   **5-Pillar Analysis**: Scores infrastructure against:
    -   Operational Excellence
    -   Security
    -   Reliability
    -   Performance Efficiency
    -   Cost Optimization (Qualitative)
-   **Visual Dashboard**: Interactive radar charts, severity-based findings, and overall readiness scores.
-   **PDF Export**: Generate professional audit reports instantly.
-   **Secure & Private**: Code is processed ephemerally; no persistent storage of your infrastructure code.
-   **Dark Mode Support**: Beautiful, responsive UI built with Tailwind CSS.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI Integration**: Google GenAI SDK (`@google/genai`)
-   **Visualization**: Recharts
-   **Utils**: `jspdf`, `html2canvas` for reporting

## 📋 Prerequisites

1.  **Node.js** (v18+ recommended)
2.  **Google Cloud API Key**: You need an API key with access to the Gemini API.
    -   Get one here: [Google AI Studio](https://aistudio.google.com/)

## 💻 Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/deployment-readiness-auditor.git
    cd deployment-readiness-auditor
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Ensure you have your API key available. The application expects `process.env.API_KEY` to be populated (via Vite define or environment variables).

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open your browser**
    Navigate to `http://localhost:5173`

## ☁️ Deployment (Google Cloud Run)

This application is optimized for deployment on Google Cloud Run as a static site served via Nginx.

### 1. Create Dockerfile
Ensure you have a `Dockerfile` in the root:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Note: Ensure API_KEY is handled via build args or injected at runtime config
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
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
  --allow-unauthenticated
```

## 🛡️ Security Note

This application runs entirely in the browser. However, it calls the Gemini API directly.
-   **Local Dev**: Safe to use direct keys.
-   **Production**: For strict security, consider implementing a lightweight backend proxy (e.g., Cloud Functions or Next.js API routes) to hold the API key and forward requests, preventing key exposure in the client-side bundle.

## 📄 License

MIT