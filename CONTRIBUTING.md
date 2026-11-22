# Contributing to Deployment Readiness Auditor (DRA)

Thank you for contributing to DRA!

## Quick Verification Workflow

1. **Frontend & Hybrid Backend (`dra-app`)**:
   ```bash
   cd dra-app
   npm ci
   npm run typecheck
   npm test
   npm run build
   ```

2. **CLI Gatekeeper (`dra-cli`)**:
   ```bash
   cd dra-cli
   make test
   make build
   ```

## Pull Request Guidelines

- Follow **Conventional Commits** (`feat:`, `fix:`, `security:`, `docs:`, `test:`, `chore:`).
- Never commit compiled binaries (`dra-cli/bin/*`), bundled assets (`dra-app/dist/*`), or `.env` files.
- Add unit tests in `dra-app/src/__tests__/` or `dra-cli/main_test.go` for any new static rules, DLP patterns, or CLI flags.
