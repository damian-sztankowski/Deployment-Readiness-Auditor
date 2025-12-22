
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Custom route for index.html to inject the API key
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error loading index.html');
      return;
    }

    const apiKey = process.env.API_KEY || '';
    

    const result = data.replace(
      /API_KEY:\s*["'][^"']*["']/g,
      `API_KEY: "${apiKey}"`
    );

    res.send(result);
  });
});

// Fallback for SPA-like behavior (optional, but good for robustness)
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});