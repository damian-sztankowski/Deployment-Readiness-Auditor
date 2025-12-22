
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

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Primary route handler for index.html with injection
// We put this BEFORE express.static to ensure injection happens for the root path
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
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(result);
  });
});

// Middleware for other static files (index.js, images, etc.)
// We specify index: false to prevent it from automatically serving index.html on /
app.use(express.static(__dirname, { index: false }));

// Fallback for Single Page Application behavior
app.get('*', (req, res) => {
  // If it looks like a file request that wasn't found in express.static, return 404
  if (req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }

  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Internal Server Error');
    const apiKey = process.env.API_KEY || '';
    const result = data.replace('__DRA_API_KEY_PLACEHOLDER__', apiKey);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(result);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DRA Deployment active on port ${PORT}`);
  console.log(`🛡️ Environment: Cloud Run Native (API_KEY bound)`);
});
