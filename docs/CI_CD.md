# CI/CD

This repository uses GitHub Actions for continuous integration, automated release, and secret scanning.

## Workflows

| Workflow | File | Trigger | Purpose |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Push + PR to `main`, `alpha` | Build, lint, test, security checks, release |
| Gitleaks | `.github/workflows/gitleaks.yml` | Push + PR to `main`, `alpha` | Scan git history for leaked secrets |

## CI jobs

### `build-and-test`

Runs on every push and PR:

1. `npm ci`
2. `npm rebuild --ignore-scripts=false`
3. `npm ci --prefix ui --legacy-peer-deps`
4. `npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm --validate-https`
5. `npm audit signatures`
6. `npm audit --audit-level=high`
7. `npm run lint:all`
8. `npm run test:cov`
9. `npm run test:e2e`
10. `npm test --prefix ui`
11. `npm run build:all`

### `release`

Runs only on **push** after `build-and-test` succeeds.

It builds backend/UI/CLI and runs semantic-release. Publishing uses npm Trusted Publishing (OIDC), so no long-lived `NPM_TOKEN` is required.

## Notes

- Release automation is configured in `.releaserc.json`.
- Semantic-release plugins are installed at runtime in CI before execution.
- For versioning rules and release behavior, see [RELEASE.md](./RELEASE.md).
