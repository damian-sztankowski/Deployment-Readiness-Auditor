# Deployment Readiness Auditor (DRA v3.0) — Architecture & Contributor Guide

## Project Overview

**Deployment Readiness Auditor (DRA)** is a hybrid deterministic-AST + AI DevSecOps quality gatekeeper for Google Cloud Infrastructure as Code (Terraform `.tf`, OpenTofu `.tofu`, `tfplan.json`, Kubernetes/GKE `.yaml`, and `Dockerfile`).

## Repository Layout

- `dra-app/`: Fullstack TypeScript application (Vite + React 19 + Tailwind CSS frontend compiled into `dist/public/`, Express 4 API server compiled into `dist/server.mjs`).
  - `src/services/dlpService.ts`: Bidirectional semantic DLP aliasing (`anonymizeHcl` + `deanonymizeAuditResult`).
  - `src/services/staticAnalyzer.ts`: Deterministic AST & CIS GCP Benchmark v2.0 rule engine with variable interpolation and multi-stack support.
  - `src/services/finopsService.ts`: Regional Google Cloud Billing SKU cost & right-sizing calculator.
  - `src/services/policyService.ts`: `.dra.yaml` organization policy guardrails and time-bounded risk waivers.
  - `src/services/remediationService.ts`: POSIX `git apply`-verified unified diff & HCL bundle generator.
  - `src/services/ssrfGuard.ts`: `net.BlockList` IPv4/IPv6 SSRF protection with local loopback dev support.
  - `src/services/geminiService.ts`: Hybrid static + Gemini (`@google/genai`) / Ollama / LM Studio orchestrator and Principal Architect Co-Pilot.
- `dra-cli/`: Standalone Go CLI (`cobra`) with client-side DLP, TTY/`NO_COLOR` detection, HTTP retries, `--changed-only` Git delta mode, SARIF 2.1.0, and `--output github-pr`.
- `infra/terraform/`: Production self-hosted Terraform module deploying DRA on Cloud Run v2 with Secret Manager, least-privilege IAM, and GitHub Workload Identity Federation.

## Engineering Conventions

1. **Security First**:
   - Never expose backend source files via `express.static`; serve exclusively from `dist/public`.
   - Always verify secrets in constant time (`timingSafeSecretMatch`) and validate Google OIDC tokens via `google-auth-library`.
   - Enforce `redirect: 'error'` and `resolveAndValidateLlmUrl` on outbound custom LLM calls.
   - Keep Mermaid diagrams in `securityLevel: 'strict'` and sanitize SVG DOM nodes before mounting.
2. **Testing Before Merge**:
   - Run `npm --prefix dra-app run typecheck && npm --prefix dra-app test && npm --prefix dra-app run build`.
   - Run `make -C dra-cli test && make -C dra-cli build`.
