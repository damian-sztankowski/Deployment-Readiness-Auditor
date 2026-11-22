import dns from 'dns/promises';
import { BlockList, isIP } from 'net';

/**
 * Hardened Outbound SSRF Guard for Custom / Self-Hosted LLM Endpoints
 * - Uses Node's native `net.BlockList` to cover full IPv4 & IPv6 reserved CIDRs
 *   (including fc00::/7 covering fd00::–fdff::, fe80::/10, 100.64.0.0/10 CGNAT,
 *   169.254.0.0/16 GCP Metadata, and IPv4-mapped IPv6 ::ffff:0:0/96).
 * - Permits loopback (localhost / 127.0.0.1 / ::1) ONLY in local development
 *   (`allowLocalLoopback = true`), restoring local Ollama & LM Studio workflows
 *   while strictly blocking internal/metadata targets in hosted Cloud Run production.
 * - Callers MUST pair with `redirect: 'error'` on `fetch()` to block HTTP 302 SSRF pivots.
 */

const buildRestrictedBlockList = (): BlockList => {
  const bl = new BlockList();
  // IPv4 reserved / private / metadata / CGNAT / multicast
  bl.addSubnet('0.0.0.0', 8, 'ipv4');
  bl.addSubnet('10.0.0.0', 8, 'ipv4');
  bl.addSubnet('100.64.0.0', 10, 'ipv4'); // Carrier-Grade NAT (RFC 6598)
  bl.addSubnet('127.0.0.0', 8, 'ipv4');
  bl.addSubnet('169.254.0.0', 16, 'ipv4'); // Link-local & GCP Metadata 169.254.169.254
  bl.addSubnet('172.16.0.0', 12, 'ipv4');
  bl.addSubnet('192.0.0.0', 24, 'ipv4');
  bl.addSubnet('192.0.2.0', 24, 'ipv4');
  bl.addSubnet('192.168.0.0', 16, 'ipv4');
  bl.addSubnet('198.18.0.0', 15, 'ipv4');
  bl.addSubnet('224.0.0.0', 4, 'ipv4');
  bl.addSubnet('240.0.0.0', 4, 'ipv4');

  // IPv6 reserved / loopback / unique-local (fc00::/7) / link-local (fe80::/10)
  bl.addAddress('::', 'ipv6');
  bl.addAddress('::1', 'ipv6');
  bl.addSubnet('fc00::', 7, 'ipv6'); // Covers BOTH fc00::/8 and fd00::/8 (fd00–fdff)
  bl.addSubnet('fe80::', 10, 'ipv6'); // Covers fe80:: through febf::
  bl.addSubnet('ff00::', 8, 'ipv6');
  return bl;
};

const RESTRICTED_BLOCKLIST = buildRestrictedBlockList();

export const isLoopbackIp = (ip: string): boolean => {
  let clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (clean.startsWith('::ffff:')) {
    clean = clean.slice(7);
  }
  return clean === '::1' || clean.startsWith('127.');
};

export const isRestrictedIp = (ip: string, allowLoopback = false): boolean => {
  let clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');

  // Unwrap IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254 or ::ffff:127.0.0.1)
  if (clean.startsWith('::ffff:')) {
    const mapped = clean.slice(7);
    if (isIP(mapped) === 4) {
      clean = mapped;
    }
  }

  if (allowLoopback && isLoopbackIp(clean)) {
    return false;
  }

  const version = isIP(clean);
  if (version === 4) {
    return RESTRICTED_BLOCKLIST.check(clean, 'ipv4');
  }
  if (version === 6) {
    return RESTRICTED_BLOCKLIST.check(clean, 'ipv6');
  }
  return true; // Reject malformed IP strings
};

export interface ValidatedUrlResult {
  url: string;
  hostHeader?: string;
}

export interface ValidateUrlOptions {
  isProduction?: boolean;
  allowedEndpoints?: string[];
}

export const resolveAndValidateLlmUrl = async (
  urlStr: string,
  opts: ValidateUrlOptions = {}
): Promise<ValidatedUrlResult> => {
  const isProduction =
    opts.isProduction ?? (process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE));

  const envAllowed = (process.env.ALLOWED_LLM_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowlist = opts.allowedEndpoints ?? envAllowed;

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error('SECURITY_ERROR: Malformed LLM endpoint URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('SECURITY_ERROR: Only http:// and https:// LLM protocols are allowed.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('SECURITY_ERROR: Credentials in LLM endpoint URLs are prohibited.');
  }

  // If running in production (Cloud Run) and an explicit allowlist is configured (or empty),
  // require client-supplied custom URLs to match ALLOWED_LLM_URLS when enforced.
  if (isProduction && allowlist.length > 0) {
    const normalizedInput = parsed.origin + parsed.pathname;
    const matched = allowlist.some((allowed) => normalizedInput.startsWith(allowed));
    if (!matched) {
      throw new Error('SECURITY_ERROR: Specified LLM URL is not in ALLOWED_LLM_URLS.');
    }
  }

  const rawHostname = parsed.hostname.toLowerCase();
  const bareHostname = rawHostname.replace(/^\[|\]$/g, '');

  // Always block cloud metadata hostnames unconditionally (even locally!)
  if (
    bareHostname === '169.254.169.254' ||
    bareHostname === 'metadata.google.internal' ||
    bareHostname === 'metadata' ||
    bareHostname.endsWith('.internal')
  ) {
    throw new Error('SECURITY_ERROR: Access to cloud metadata or internal endpoints is prohibited.');
  }

  const allowLoopback = !isProduction;

  if (!allowLoopback && (bareHostname === 'localhost' || bareHostname.endsWith('.local'))) {
    throw new Error('SECURITY_ERROR: Localhost LLM endpoints are disabled on hosted Cloud Run instances.');
  }

  // Local dev fast-path for localhost
  if (allowLoopback && (bareHostname === 'localhost' || bareHostname === '127.0.0.1' || bareHostname === '::1')) {
    return { url: parsed.toString() };
  }

  let resolvedIp: string;
  if (isIP(bareHostname)) {
    if (isRestrictedIp(bareHostname, allowLoopback)) {
      throw new Error('SECURITY_ERROR: Access to private or reserved IP ranges is restricted.');
    }
    resolvedIp = bareHostname;
  } else {
    let lookupResults: Array<{ address: string; family: number }>;
    try {
      lookupResults = await dns.lookup(bareHostname, { all: true });
    } catch {
      throw new Error('SECURITY_ERROR: Unable to resolve LLM endpoint hostname.');
    }
    if (!lookupResults || lookupResults.length === 0) {
      throw new Error('SECURITY_ERROR: Empty DNS resolution for LLM endpoint.');
    }
    for (const entry of lookupResults) {
      if (isRestrictedIp(entry.address, allowLoopback)) {
        throw new Error('SECURITY_ERROR: LLM hostname resolves to a restricted IP address.');
      }
    }
    resolvedIp = lookupResults[0].address;
  }

  // Pin HTTP hostname to the validated IP to defeat DNS rebinding
  if (parsed.protocol === 'http:') {
    const originalHost = parsed.host;
    const rewritten = new URL(urlStr);
    rewritten.hostname = resolvedIp.includes(':') ? `[${resolvedIp}]` : resolvedIp;
    return {
      url: rewritten.toString(),
      hostHeader: originalHost
    };
  }

  return { url: parsed.toString() };
};
