import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { analyzeInfrastructure } from './src/services/geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Parsowanie JSON - niezbędne dla API!
app.use(express.json({ limit: '10mb' }));

// Cryptographic token signing for the frontend SPA session to prevent header spoofing
const serverSecret = crypto.randomBytes(32).toString('hex');

const generateSignature = (token: string) => {
    return crypto.createHmac('sha256', serverSecret).update(token).digest('hex');
};

const parseCookies = (cookieHeader: string) => {
    const list: Record<string, string> = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const name = parts.shift()?.trim();
        if (name) {
            list[name] = decodeURIComponent(parts.join('='));
        }
    });
    return list;
};

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
                const cookies = parseCookies(req.headers.cookie || '');
                const appToken = cookies.app_token;
                if (appToken) {
                    const [t, s] = appToken.split('.');
                    if (t && s && generateSignature(t) === s) {
                        return next();
                    }
                }
            }
        } catch {
            // Fall through
        }
    }

    return res.status(401).json({ error: "Access denied. Missing valid Authorization token." });
};

// Rate limiter to protect against Denial of Wallet and runaway billing
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10);
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = (req: any, res: any, next: any) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const clientRecord = rateLimitMap.get(ip);

    if (!clientRecord || now > clientRecord.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return next();
    }

    if (clientRecord.count >= MAX_REQUESTS_PER_WINDOW) {
        const retryAfter = Math.ceil((clientRecord.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
            error: `RATE_LIMIT_EXCEEDED: Rate limit reached (${MAX_REQUESTS_PER_WINDOW} requests/min). Please wait ${retryAfter}s before retrying.`
        });
    }

    clientRecord.count++;
    return next();
};

// Cleanup expired rate limit tracking entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

app.post('/api/audit', rateLimiter, authenticateRequest, async (req, res) => {
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

    const token = crypto.randomBytes(16).toString('hex');
    const sig = generateSignature(token);
    const cookieValue = `${token}.${sig}`;
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `app_token=${cookieValue}; Path=/; HttpOnly; SameSite=Strict${isSecure ? '; Secure' : ''}`);

    res.send(data);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DRA Server active on port ${PORT}`);
  console.log(`🛡️  Mode: Fullstack API Enabled`);
});
