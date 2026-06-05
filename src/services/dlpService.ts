/**
 * Enterprise-Grade DLP (Data Loss Prevention) Service
 * Implements semantic aliasing to preserve architectural topography 
 * while scrubbing sensitive identifiers.
 */

interface RedactionMap {
  [key: string]: {
    alias: string;
    type: string;
  };
}

// Strictly ignore standard "any" or "default" patterns used in audit logic
const IGNORE_PATTERNS = [
  '0.0.0.0/0',
  '::/0',
  'default',
  'us-central1',
  'europe-west1',
  'standard',
  'enforced'
];

/**
 * Enterprise DLP Engine
 * Performs two-pass processing:
 * 1. Discover and map sensitive identifiers to semantic aliases.
 * 2. Replace occurrences to maintain relationship integrity.
 */
export const anonymizeHcl = (code: string): AuditDlpResult => {
  if (!code) return { sanitizedCode: code, redactionCount: 0, types: {} };

  const redactionMap: RedactionMap = {};
  let redactionCount = 0;
  const types: Record<string, number> = {};

  const getAlias = (original: string, category: string): string => {
    if (IGNORE_PATTERNS.includes(original.toLowerCase())) return original;
    
    const key = `${category}:${original}`;
    if (!redactionMap[key]) {
      const index = Object.values(redactionMap).filter(v => v.type === category).length + 1;
      const alias = `${category.toUpperCase()}_${index}`;
      redactionMap[key] = { alias, type: category };
      redactionCount++;
      types[category] = (types[category] || 0) + 1;
    }
    return redactionMap[key].alias;
  };

  let processed = code;

  // 1. Scrub Emails / Identities
  const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  processed = processed.replace(EMAIL_REGEX, (match) => getAlias(match, 'Identity'));

  // 2. Scrub IP Ranges (IPv4/CIDR)
  const IP_REGEX = /\b(?!(?:0\.0\.0\.0(?:\/0)?)\b)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?\b/g;
  processed = processed.replace(IP_REGEX, (match) => getAlias(match, 'IP_Range'));

  // 3. Scrub Sensitive Key-Value Pairs (Projects, Billing, Orgs)
  const ID_KEYS = 'project|project_id|org_id|billing_account|folder_id|service_account_id|account_id';
  const ID_REGEX = new RegExp(`((?:${ID_KEYS})\\s*[:=]\\s*["'])([a-zA-Z0-9-_\\.:]{4,128})(["'])`, 'gi');
  processed = processed.replace(ID_REGEX, (m, p1, p2, p3) => `${p1}${getAlias(p2, 'Cloud_ID')}${p3}`);

  // 4. Scrub Global Resource Names (Buckets, DBs)
  const RES_KEYS = 'bucket|bucket_name|database_instance|instance_name|repository_id|container_name';
  const RES_REGEX = new RegExp(`((?:${RES_KEYS})\\s*[:=]\\s*["'])([a-z0-9-._]{3,128})(["'])`, 'gi');
  processed = processed.replace(RES_REGEX, (m, p1, p2, p3) => `${p1}${getAlias(p2, 'Resource_Name')}${p3}`);

  // 5. Scrub Networking Topography (VPCs, Subnets)
  const NET_KEYS = 'network|subnetwork|vpc|dns_name|domain_name';
  const NET_REGEX = new RegExp(`((?:${NET_KEYS})\\s*[:=]\\s*["'])([a-z][a-z0-9-]{2,128})(["'])`, 'gi');
  processed = processed.replace(NET_REGEX, (m, p1, p2, p3) => `${p1}${getAlias(p2, 'Network_Topography')}${p3}`);

  // 6. Hard-Redact Secrets (Zero preservation - Full obfuscation)
  const SECRET_KEYS = 'password|secret|key_data|private_key|api_key|token|access_key|auth_token|certificate|connection_string';
  const SECRET_REGEX = new RegExp(`((?:${SECRET_KEYS})\\s*[:=]\\s*["'])([^"']+)(["'])`, 'gi');
  processed = processed.replace(SECRET_REGEX, '$1[REDACTED_SECRET]$3');

  // 7. Scrub Metadata & Labels (Owner, Team, Cost Center)
  const META_KEYS = 'owner|creator|contact|team|cost_center|business_unit';
  const META_REGEX = new RegExp(`((?:${META_KEYS})\\s*[:=]\\s*["'])([^"']+)(["'])`, 'gi');
  processed = processed.replace(META_REGEX, (m, p1, p2, p3) => `${p1}${getAlias(p2, 'Org_Metadata')}${p3}`);

  // 8. Scrub Environment & Tier Indicators (master, primary, prod, main, etc. in names/labels)
  // This helps hide the "importance" or "tier" of a resource from being leaked via naming conventions
  const ENV_INDICATORS = 'prod|production|master|primary|main|staging|stg|dev|development|test|uat|dr|backup|secondary';
  const ENV_KEY_REGEX = new RegExp(`((?:name|labels?|tags?|env|environment|tier|role)\\s*[:=]\\s*["'])([^"']*?(?:${ENV_INDICATORS})[^"']*?)(["'])`, 'gi');
  processed = processed.replace(ENV_KEY_REGEX, (m, p1, p2, p3) => `${p1}${getAlias(p2, 'Env_Indicator')}${p3}`);

  return {
    sanitizedCode: processed,
    redactionCount,
    types
  };
};

export interface AuditDlpResult {
  sanitizedCode: string;
  redactionCount: number;
  types: Record<string, number>;
}