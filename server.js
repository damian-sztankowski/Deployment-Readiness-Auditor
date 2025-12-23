import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * DEPLOYMENT READINESS SERVER
 * Dynamically injects the API_KEY from Cloud Run environment variables
 * into the index.html served to the client.
 */

const handleIndexRequest = (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Inject the API_KEY from the server environment into the client shim
    // Use split/join for global replacement
    const apiKey = (process.env.API_KEY || '').trim();
    const result = data.split('__DRA_API_KEY_PLACEHOLDER__').join(apiKey);
    
    // Set headers to prevent caching of the sensitive key or stale placeholders
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(result);
  });
};

// Health check for Cloud Run load balancers
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Explicitly handle root and index.html with injection
app.get('/', handleIndexRequest);
app.get('/index.html', handleIndexRequest);

// Serve other static assets (js, images, css)
// index: false prevents express.static from serving index.html automatically without injection
app.use(express.static(__dirname, { index: false }));

// Fallback for Single Page Application behavior
app.get('*', (req, res) => {
  if (req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }
  handleIndexRequest(req, res);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DRA Audit Engine active on port ${PORT}`);
  console.log(`🛡️ Environment: Cloud Run Native`);
  console.log(`🔑 Key Injection: Enabled`);
});