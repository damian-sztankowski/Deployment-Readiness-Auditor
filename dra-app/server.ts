import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { analyzeInfrastructure, askArchitectCopilot } from './src/services/geminiService.js';
import { GEMINI_MODEL } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve compiled SPA static assets directory (`dist/public` in dev, `./public` when bundled in `dist/server.mjs`)
const resolvePublicDir = (): string => {
  const candidates = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'dist', 'public')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return path.join(__dirname, 'dist', 'public');
};

const oauthClient = new OAuth2Client();

/**
 * Constant-time string comparison using SHA-256 normalization so secret length is never leaked.
 */
export const timingSafeSecretMatch = (candidate: string, expected: string): boolean => {
  if (!candidate || !expected) return false;
  const h1 = crypto.createHash('sha256').update(candidate, 'utf8').digest();
  const h2 = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(h1, h2);
};

// Persistent session HMAC secret (falls back to deterministic derivation or random in dev)
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (process.env.DRA_API_KEY || process.env.API_KEY
    ? crypto
        .createHmac('sha256', 'dra-session-key-v3')
        .update(process.env.DRA_API_KEY || process.env.API_KEY || '')
        .digest('hex')
    : crypto.randomBytes(32).toString('hex'));

export const signSessionToken = (token: string): string =>
  crypto.createHmac('sha256', SESSION_SECRET).update(token).digest('hex');

export const verifySessionCookieValue = (cookieVal?: string): boolean => {
  if (!cookieVal) return false;
  const dotIdx = cookieVal.indexOf('.');
  if (dotIdx <= 0) return false;
  const raw = cookieVal.slice(0, dotIdx);
  const sig = cookieVal.slice(dotIdx + 1);
  if (!raw || !sig) return false;
  return timingSafeSecretMatch(sig, signSessionToken(raw));
};

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const idx = cookie.indexOf('=');
    if (idx > 0) {
      const name = cookie.slice(0, idx).trim();
      const val = cookie.slice(idx + 1).trim();
      try {
        list[name] = decodeURIComponent(val);
      } catch {
        list[name] = val;
      }
    }
  });
  return list;
};

export const createApp = () => {
  const app = express();

  // Trust 1 upstream proxy hop (Google Cloud Run / GFE Load Balancer) so `req.ip` cannot be spoofed via X-Forwarded-For
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Tightened 2MB JSON payload limit to mitigate Denial-of-Wallet memory amplification
  app.use(express.json({ limit: '2mb' }));

  // Companion HTTP Security Headers & Fetch Metadata Resource Isolation (per modern-web-guidance `security`)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Vary', 'Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), geolocation=(), microphone=(), payment=()'
    );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    );

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (isSecure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Fetch Metadata cross-site request rejection for state-changing / API endpoints
    const secFetchSite = req.get('Sec-Fetch-Site');
    if (
      secFetchSite &&
      secFetchSite === 'cross-site' &&
      req.path.startsWith('/api/') &&
      !req.headers['authorization'] &&
      !req.headers['x-api-key']
    ) {
      res.status(403).json({ error: 'SECURITY_ERROR: Cross-site browser requests are forbidden.' });
      return;
    }

    next();
  });

  // Sliding-window Rate Limiter using proxy-verified `req.ip`
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS_PER_WINDOW = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10);
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();

  const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - 1));
      next();
      return;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error: `RATE_LIMIT_EXCEEDED: Rate limit reached (${MAX_REQUESTS_PER_WINDOW} requests/min). Retry in ${retryAfter}s.`
      });
      return;
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - record.count));
    next();
  };

  // Hardened Authentication Middleware (API Key + Verified Google OIDC/OAuth + Same-Origin Signed Session)
  const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const headerApiKey = String(req.headers['x-api-key'] || req.headers['x-goog-api-key'] || '');

    const configuredKeys = [process.env.DRA_API_KEY, process.env.API_KEY].filter(
      (k): k is string => Boolean(k && k !== '__DRA_API_KEY_PLACEHOLDER__')
    );

    // 1. Constant-time API key check
    if (headerApiKey && configuredKeys.some((k) => timingSafeSecretMatch(headerApiKey, k))) {
      next();
      return;
    }

    // 2. Bearer token validation (API key OR verified Google OIDC / OAuth token with audience/identity check)
    if (bearerToken) {
      if (configuredKeys.some((k) => timingSafeSecretMatch(bearerToken, k))) {
        next();
        return;
      }

      const allowedAudiences = (process.env.ALLOWED_AUDIENCES || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const allowedEmails = (process.env.ALLOWED_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const hostOrigin = req.headers.host ? `https://${req.headers.host}` : undefined;
      const effectiveAudiences =
        allowedAudiences.length > 0
          ? allowedAudiences
          : hostOrigin
            ? [hostOrigin, `${hostOrigin}/api/audit`]
            : undefined;

      try {
        if (!bearerToken.startsWith('ya29.')) {
          // Verify cryptographic signature, expiration, issuer, and audience of Google OIDC ID Token
          const ticket = await oauthClient.verifyIdToken({
            idToken: bearerToken,
            audience: effectiveAudiences
          });
          const payload = ticket.getPayload();
          if (!payload || !payload.email_verified) {
            res.status(403).json({ error: 'Access denied. Unverified OIDC token identity.' });
            return;
          }
          const email = (payload.email || '').toLowerCase();
          const hd = (payload.hd || '').toLowerCase();
          if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
            res.status(403).json({ error: 'Access denied. Principal email is not authorized.' });
            return;
          }
          if (allowedDomains.length > 0 && !allowedDomains.includes(hd) && !allowedDomains.some((d) => email.endsWith(`@${d}`))) {
            res.status(403).json({ error: 'Access denied. Workspace domain is not authorized.' });
            return;
          }
          next();
          return;
        } else {
          // OAuth2 Access Token: enforce explicit principal/domain allowlist so random Google tokens cannot pass
          if (allowedEmails.length === 0 && allowedDomains.length === 0) {
            res.status(403).json({
              error:
                'Access denied. Use an OIDC Identity Token (`gcloud auth print-identity-token --audiences=...`) or configure ALLOWED_EMAILS / ALLOWED_EMAIL_DOMAINS.'
            });
            return;
          }
          const infoResp = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(bearerToken)}`,
            { redirect: 'error', signal: AbortSignal.timeout(8_000) }
          );
          if (!infoResp.ok) {
            res.status(403).json({ error: 'Access denied. Invalid or expired access token.' });
            return;
          }
          const info = (await infoResp.json()) as { email?: string; email_verified?: string };
          const email = (info.email || '').toLowerCase();
          if (info.email_verified !== 'true' || !email) {
            res.status(403).json({ error: 'Access denied. Access token lacks verified email scope.' });
            return;
          }
          const emailAllowed =
            (allowedEmails.length > 0 && allowedEmails.includes(email)) ||
            (allowedDomains.length > 0 && allowedDomains.some((d) => email.endsWith(`@${d}`)));
          if (!emailAllowed) {
            res.status(403).json({ error: 'Access denied. Access token principal is not authorized.' });
            return;
          }
          next();
          return;
        }
      } catch (err: any) {
        res.status(403).json({
          error: `Access denied. Token verification failed: ${err.message || 'Invalid token'}`
        });
        return;
      }
    }

    if (!isProduction) {
      next();
      return;
    }

    // Strict API-only enforcement option for private enterprise deployments
    if (process.env.REQUIRE_STRICT_AUTH === 'true') {
      res.status(401).json({
        error: 'Access denied. Strict authentication is enabled; provide X-API-Key or OIDC Bearer token.'
      });
      return;
    }

    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.startsWith('Go-http-client') || userAgent.startsWith('dra-cli')) {
      res.status(401).json({
        error: 'Access denied. CLI requests must provide a verified GCP OIDC token or DRA_API_KEY.'
      });
      return;
    }

    // Same-origin SPA session verification (`__Host-dra_session` or `dra_session`)
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies['__Host-dra_session'] || cookies['dra_session'];
    const secFetchSite = req.get('Sec-Fetch-Site');
    const sameOriginOk = !secFetchSite || secFetchSite === 'same-origin';

    if (sameOriginOk && verifySessionCookieValue(sessionToken)) {
      next();
      return;
    }

    res.status(401).json({ error: 'Access denied. Missing valid session or Authorization token.' });
  };

  // Runtime engine capabilities & Showcase detection endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    const apiKey = process.env.API_KEY;
    const hasGeminiKey =
      Boolean(apiKey) && apiKey !== '' && apiKey !== '__DRA_API_KEY_PLACEHOLDER__';
    res.json({
      status: 'ok',
      version: '3.0.0',
      hasGeminiKey,
      defaultModel: process.env.LLM_MODEL || GEMINI_MODEL,
      defaultProvider: process.env.LLM_PROVIDER || (hasGeminiKey ? 'gemini' : 'static')
    });
  });

  // Standard JSON Audit Endpoint (used by `dra-cli` and fallback clients)
  app.post('/api/audit', rateLimiter, authenticateRequest, async (req: Request, res: Response) => {
    try {
      const { code, policyYaml, llmProvider, llmModel, llmUrl } = req.body || {};
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'AUDIT_ERROR: No code provided for analysis.' });
        return;
      }

      const result = await analyzeInfrastructure(code, {
        provider: llmProvider,
        modelName: llmModel,
        modelUrl: llmUrl,
        policyYaml: typeof policyYaml === 'string' ? policyYaml : undefined
      });
      res.json(result);
    } catch (error: any) {
      const msg = error?.message || 'Internal server error';
      const status = msg.startsWith('SECURITY_ERROR:')
        ? 403
        : msg.startsWith('AUDIT_ERROR:')
          ? 400
          : 500;
      console.error('[DRA API ERROR]', msg);
      res.status(status).json({ error: msg });
    }
  });

  // Server-Sent Events (SSE) Live Streaming Audit Endpoint
  app.post(
    '/api/audit/stream',
    rateLimiter,
    authenticateRequest,
    async (req: Request, res: Response) => {
      const { code, policyYaml, llmProvider, llmModel, llmUrl } = req.body || {};
      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'AUDIT_ERROR: No code provided for analysis.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const sendEvent = (eventType: string, payload: unknown) => {
        if (!res.writableEnded) {
          res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
        }
      };

      try {
        const result = await analyzeInfrastructure(code, {
          provider: llmProvider,
          modelName: llmModel,
          modelUrl: llmUrl,
          policyYaml: typeof policyYaml === 'string' ? policyYaml : undefined,
          onProgress: (stageEvt) => sendEvent('stage', stageEvt)
        });
        sendEvent('result', result);
      } catch (error: any) {
        sendEvent('error', { error: error?.message || 'Internal server error' });
      } finally {
        if (!res.writableEnded) {
          res.end();
        }
      }
    }
  );

  // Contextual "Ask Principal Architect" Co-Pilot Endpoint
  app.post('/api/chat', rateLimiter, authenticateRequest, async (req: Request, res: Response) => {
    try {
      const { question, finding, auditSummary, codeSnippet, history, llmProvider, llmModel } =
        req.body || {};
      const answer = await askArchitectCopilot({
        question,
        finding,
        auditSummary,
        codeSnippet,
        history,
        provider: llmProvider,
        modelName: llmModel
      });
      res.json({ answer });
    } catch (error: any) {
      const msg = error?.message || 'Unable to process architect query.';
      res.status(msg.startsWith('AUDIT_ERROR:') ? 400 : 500).json({ error: msg });
    }
  });

  // Cloud Run Health Probe
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Serve ONLY compiled static frontend assets from `dist/public` — NEVER source files!
  const publicDir = resolvePublicDir();
  app.use(
    express.static(publicDir, {
      index: false,
      maxAge: '1h',
      immutable: false
    })
  );

  // SPA HTML Fallback with hardened `__Host-dra_session` / `dra_session` cookie
  app.get('*', (req: Request, res: Response) => {
    if (req.path.includes('.')) {
      res.status(404).send('Not Found');
      return;
    }

    const indexHtmlPath = path.join(publicDir, 'index.html');
    fs.readFile(indexHtmlPath, 'utf8', (err, data) => {
      if (err) {
        res.status(500).send('Application bundle missing. Run `npm run build` first.');
        return;
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const rawToken = crypto.randomBytes(16).toString('hex');
      const sig = signSessionToken(rawToken);
      const cookieValue = `${rawToken}.${sig}`;
      const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const cookieName = isSecure ? '__Host-dra_session' : 'dra_session';
      res.setHeader(
        'Set-Cookie',
        `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax${isSecure ? '; Secure' : ''}`
      );

      res.send(data);
    });
  });

  return app;
};

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.mjs'));

if (isDirectExecution) {
  const PORT = Number(process.env.PORT || 8080);
  const app = createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DRA v3.0 Server active on port ${PORT}`);
    console.log(`🛡️  Mode: Hybrid AST + AI Fullstack Engine Enabled`);
  });
}
