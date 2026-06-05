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
app.post('/api/audit', async (req, res) => {
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