/**
 * Enhanced DLP Service: Strategic redaction for Enterprise CI/CD compatibility.
 */

export const anonymizeHcl = (code: string): string => {
  if (!code) return code;

  let anonymized = code;

  // 1. IP Ranges (Preserve 0.0.0.0/0 for audit logic, redact others)
  // We keep 0.0.0.0/0 because your DRA needs it to flag critical security risks.
  const ipRegex = /\b(?!(?:0\.0\.0\.0(?:\/0)?)\b)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?\b/g;
  anonymized = anonymized.replace(ipRegex, 'IP_RANGE_REDACTED');

  // 2. Project IDs & Organization IDs
  const projectRegex = /((?:project|project_id|org_id|billing_account)\s*[:=]\s*["'])([a-zA-Z0-9-]{4,64})(["'])/gi;
  anonymized = anonymized.replace(projectRegex, '$1ID_REDACTED$3');

  // 3. Secrets, Keys, and Sensitive Strings (Crucial for DLP)
  // Targets values assigned to keys like 'password', 'secret', 'key_data', 'private_key'
  const secretRegex = /((?:password|secret|key_data|private_key|api_key|token)\s*[:=]\s*["'])([^"']+)(["'])/gi;
  anonymized = anonymized.replace(secretRegex, '$1SECRET_REDACTED$3');

  // 4. Emails & IAM Members
  // Redacts emails in 'member' or 'author' fields (e.g., user:admin@company.com)
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  anonymized = anonymized.replace(emailRegex, 'identity-redacted@example.com');

  // 5. Networking (VPC, Subnets, DNS Zones)
  const networkRegex = /((?:network|subnetwork|vpc|dns_name|domain)\s*[:=]\s*["'])([a-z][a-z0-9-]{2,62})(["'])/gi;
  anonymized = anonymized.replace(networkRegex, '$1NET_RESOURCE_REDACTED$3');

  // 6. Labels & Metadata (Often contains sensitive owner names)
  const labelRegex = /((?:owner|creator|contact|team)\s*[:=]\s*["'])([^"']+)(["'])/gi;
  anonymized = anonymized.replace(labelRegex, '$1METADATA_REDACTED$3');

  return anonymized;
};