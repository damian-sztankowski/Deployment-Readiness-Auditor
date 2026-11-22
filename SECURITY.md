# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :---: |
| `3.0.x` | ✅ |
| `< 3.0` | ❌ |

## Security Architecture Controls

- **Zero Source Exposure**: Express serves compiled SPA assets strictly from `dist/public`.
- **Bidirectional Client-Side DLP**: Sensitive identifiers (project IDs, VPCs, emails, private IPs) are aliased on the client before transmission and restored locally, while secrets (`AIzaSy...`, PEM private keys, `AKIA...`, tokens) are permanently scrubbed.
- **Hardened Authentication**: Constant-time SHA-256 HMAC API key verification, `google-auth-library` OIDC audience/domain verification, and `__Host-dra_session` cookies.
- **SSRF & Redirect Defense**: `net.BlockList` IPv4/IPv6 validation paired with `redirect: 'error'` and strict outbound timeouts.
- **Prompt Injection Defense**: Randomized XML untrusted-payload boundaries paired with deterministic static AST score ceilings.
- **DOM XSS Prevention**: Strict Mermaid rendering (`securityLevel: 'strict'`) and DOMParser SVG allowlist sanitization.

## Reporting a Vulnerability

Please report security issues privately via GitHub Security Advisories on this repository rather than opening a public issue. Include reproduction steps and affected component (`dra-app`, `dra-cli`, or `infra/terraform`).
