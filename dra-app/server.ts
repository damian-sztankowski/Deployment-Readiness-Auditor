import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeInfrastructure } from './src/services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Parsowanie JSON - niezbędne dla API!
app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------
// TWOJE GŁÓWNE API (Dla Frontendu oraz dra-cli)
// -----------------------------------------------------
const authenticateRequest = async (req: any, res: any, next: any) => {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const url = token.startsWith('ya29.')
                ? `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
                : `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
            const response = await fetch(url);
            if (!response.ok) {
                return res.status(403).json({ error: "Access denied. Invalid or expired Authorization token." });
            }
            return next();
        } catch (err: any) {
            return res.status(403).json({ error: `Access denied. Token validation failed: ${err.message}` });
        }
    }

    if (!isProduction) {
        return next();
    }

    const host = req.headers.host;
    const referer = req.headers.referer;
    const userAgent = req.headers['user-agent'] || '';

    if (userAgent.startsWith('Go-http-client')) {
        return res.status(401).json({ error: "Access denied. CLI requests must provide a GCP_IAM_TOKEN." });
    }

    if (referer) {
        try {
            const refererUrl = new URL(referer);
            if (refererUrl.host === host) {
                return next();
            }
        } catch {
            // Fall through
        }
    }

    return res.status(401).json({ error: "Access denied. Missing valid Authorization token." });
};

app.post('/api/audit', authenticateRequest, async (req, res) => {
    try {
        const { code, llmProvider, llmModel, llmUrl } = req.body;
        if (!code) {
            return res.status(400).json({ error: "No code provided for analysis." });
        }
        
        const result = await analyzeInfrastructure(code, {
            provider: llmProvider,
            modelName: llmModel,
            modelUrl: llmUrl
        });
        res.json(result);
    } catch (error: any) {
        console.error("[DRA API ERROR]", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// Health check for Cloud Run
app.get('/health', (req, res) => res.status(200).send('OK'));

// Serwowanie plików statycznych (poza index.html)
app.use(express.static(__dirname, { index: false }));

// Fallback (SPA)
app.get('*', (req, res) => {
  if (req.path.includes('.')) return res.status(404).send('Not Found');
  
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Internal Server Error');
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(data);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DRA Server active on port ${PORT}`);
  console.log(`🛡️  Mode: Fullstack API Enabled`);
});