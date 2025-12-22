# 🛡️ Deployment Readiness Auditor (DRA)

<p align="left">
  <img src="https://img.shields.io/badge/Google%20Cloud-%234285F4.svg?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Powered%20by%20Gemini-blue?style=for-the-badge&logo=google-gemini&logoColor=white" />
</p>

The **Deployment Readiness Auditor (DRA)** is a Google Cloud-native, AI-assisted platform designed to analyze infrastructure-as-code (Terraform/HCL) against official **Google Cloud Well-Architected** pillars and regulatory standards.

---

## 🚀 Public MVP Deployment Checklist

If you are publishing this as a public site, follow these mandatory security steps:

### 1. Restrict your API Key (CRITICAL)
Your API key is exposed to the browser. You **must** restrict it to your domain to prevent unauthorized usage:
1. Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Edit your Gemini API Key.
3. Under **Set an application restriction**, select **Websites (HTTP referrers)**.
4. Add your production domain (e.g., `https://your-dra-app.web.app/*`).
5. This ensures the key only works when called from *your* specific website.

### 2. Deployment Options
- **Google Cloud Run**: (Recommended) Use the provided `Dockerfile` and `server.js`. 
- **Firebase Hosting**: Excellent for SPAs with global CDN.
- **Vercel / Netlify**: Connect your GitHub repo and set `API_KEY` as an environment variable.

### 3. Usage Limits
- Monitor your [AI Studio Quotas](https://aistudio.google.com/app/plan_management).
- The app includes a **BYOK (Bring Your Own Key)** feature in Settings, allowing power users to use their own quotas if the MVP key is exhausted.

---

## 🛠️ Local Development
1. Clone the repo.
2. Edit `index.html` or set an environment variable `API_KEY`.
3. `npm install && npm start`.

## 🔒 Security & Privacy
- **Zero Knowledge**: Code is processed ephemerally. No database is used.
- **Local Storage**: Audit history remains on the user's device.
- **HTTPS Enforced**: All communication with Gemini is encrypted via TLS.

---

**Disclaimer**: *Assessment findings are AI-generated. Always perform a manual review of infrastructure changes before production application.*