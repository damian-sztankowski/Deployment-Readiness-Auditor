# 🛡️ Deployment Readiness Auditor (DRA)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Pro-orange.svg)](https://deepmind.google/technologies/gemini/)
[![GCP](https://img.shields.io/badge/Platform-Google%20Cloud-blue.svg)](https://cloud.google.com/)

> **The intelligent "Pre-Apply" layer for Google Cloud Infrastructure.**

---

## 💻 Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/deployment-readiness-auditor.git
    cd deployment-readiness-auditor
    ```

2.  **Set your API Key**
    Open `index.html` and update the `window.process.env.API_KEY` value, or ensure your local environment provides it.

3.  **Launch**
    Use any static server (like `npx serve .`) or open `index.html` in a browser that supports ESM and JSX (or use a tool like Vite for a faster local experience).

---

## ☁️ Deployment (Google Cloud Run)

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
  --port 3000 \
  --set-env-vars API_KEY=your_actual_key_here
```

---

## 🛡️ Security Note
This application runs entirely in the browser. For production environments, it is recommended to proxy API requests through a backend to keep your API key secure.

---

> Built with ❤️ for the Google Cloud Community by Damian Sztankowski.