# CI/CD

This repository uses GitHub Actions for continuous integration, release automation, and secret scanning.

## Workflows

| Workflow | File | Trigger | Purpose |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Push + pull request on `main`, `alpha` | Run build/test/security checks and, on push only, execute the release job |
| Gitleaks | `.github/workflows/gitleaks.yml` | Push + pull request on `main`, `alpha` | Scan commits and history for leaked secrets |

## CI jobs

### `build-and-test`

The main CI job runs these steps in order:

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

The release job is part of `ci.yml`, not a separate workflow file.

- Runs only on **push**
- Waits for `build-and-test` to succeed
- Rebuilds the project, including the CLI
- Publishes with semantic-release using npm Trusted Publishing via GitHub OIDC

For versioning and branch policy details, see [RELEASE.md](./RELEASE.md).

## Useful local verification

For the closest CI parity, run:

```bash
npm audit --audit-level=high
npm run lint:all
npm run test:cov
npm run test:e2e
npm test --prefix ui
npm run build:all
```

For quicker day-to-day iteration, this smaller set is still useful:

```bash
npm run lint:all
npm run test:all
```

## Notes

- CI validates lockfile integrity and package signatures before linting or testing.
- Native modules are rebuilt in CI because source installs use hardened npm settings.
- Semantic-release plugins are installed at runtime in the release job before execution.
