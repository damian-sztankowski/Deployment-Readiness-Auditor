import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * PRODUCTION MVP SERVER:
 * 1. Serves static frontend assets.
 * 2. Injects API_KEY into index.html at runtime.
 * 3. Fallback for SPA routing.
 */

// Serve static files from the root directory
app.use(express.static(__dirname));

// Custom route for index.html to inject the API key
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Critical Error: Failed to load index.html');
      return;
    }

    // Default to empty string if not provided in environment
    const apiKey = process.env.API_KEY || '';

    // Regex to find and replace the shimmed API_KEY
    const result = data.replace(
      /API_KEY:\s*["'][^"']*["']/g,
      `API_KEY: "${apiKey}"`
    );

    res.send(result);
  });
});

// Fallback for SPA-like behavior (Ensures refreshes on subroutes work)
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 DRA Production Server active on port ${PORT}`);
  console.log(`🛡️ Global API Key: ${process.env.API_KEY ? 'CONFIGURED' : 'NOT FOUND'}`);
});