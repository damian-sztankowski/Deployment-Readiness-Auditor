
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

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Inject the API_KEY from the server environment into the client shim
    const apiKey = process.env.API_KEY || '';
    const result = data.replace('__DRA_API_KEY_PLACEHOLDER__', apiKey);
    
    res.send(result);
  });
});

// Serve static assets (js, css, etc.)
app.use(express.static(__dirname));

// Fallback for SPA-like behavior
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Internal Server Error');
    const apiKey = process.env.API_KEY || '';
    const result = data.replace('__DRA_API_KEY_PLACEHOLDER__', apiKey);
    res.send(result);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DRA Deployment active on port ${PORT}`);
  console.log(`🛡️ Environment: Cloud Run Native (API_KEY bound)`);
});
