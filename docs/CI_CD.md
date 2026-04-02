# CI/CD Pipeline

This document explains the CI/CD pipeline, release process, and supply chain security measures used in Agent Orchestrator.

## Overview

The pipeline is defined in two GitHub Actions workflow files:

| Workflow | File | Purpose |
|----------|------|---------|
| **CI** | `.github/workflows/ci.yml` | Build, test, lint, security checks, and release |
| **Gitleaks** | `.github/workflows/gitleaks.yml` | Secret leak detection in git history |

Both workflows run on pushes and pull requests to the `main` and `alpha` branches.

## CI Workflow

The CI workflow has two jobs:

### 1. `build-and-test`

Runs on every push and pull request. Steps in order:

| Step | What it does |
|------|-------------|
| Install build tools | `build-essential` + `python3` for native module compilation |
| Install dependencies | `npm ci` (deterministic install from lockfile) |
| Rebuild native modules | `npm rebuild --ignore-scripts=false` (see [Native Modules](#native-modules)) |
| Install UI dependencies | `npm ci --prefix ui` |
| Validate lockfile integrity | `lockfile-lint` ensures all packages use HTTPS from the npm registry |
| Verify package signatures | `npm audit signatures` validates registry-signed packages |
| npm audit | Fails on high/critical vulnerabilities |
| Lint | `npm run lint:all` (ESLint on backend + UI) |
| Unit tests with coverage | `npm run test:cov` |
| E2E tests | `npm run test:e2e` |
| UI tests | `npm test --prefix ui` |
| Build | `npm run build:all` (backend + UI) |

### 2. `release`

Runs **only on push** (not on PRs) and **only after `build-and-test` succeeds**.

This job uses [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning and publishing based on [Conventional Commits](https://www.conventionalcommits.org/).

## Release Process

### How It Works

1. You push a commit to `main` or `alpha`
2. CI runs all checks (lint, tests, build, security)
3. If CI passes, the `release` job runs
4. `semantic-release` analyzes commit messages since the last release
5. If there are releasable changes (`feat:`, `fix:`, `perf:`, or breaking changes), it:
   - Determines the next version number (semver)
   - Updates `CHANGELOG.md`
   - Publishes the package to npm
   - Creates a GitHub release with release notes
   - Commits the version bump back to the branch

### Branch Strategy

| Branch | Release type | npm tag | Example version |
|--------|-------------|---------|-----------------|
| `main` | Stable | `latest` | `1.2.0` |
| `alpha` | Pre-release | `alpha` | `1.2.0-alpha.3` |

This is configured in `.releaserc.json`:

```json
{
  "branches": [
    "main",
    { "name": "alpha", "prerelease": true }
  ]
}
```

### Commit Types That Trigger Releases

| Commit prefix | Version bump | Example |
|--------------|-------------|---------|
| `fix:` | Patch (`1.0.1`) | `fix(auth): validate jwt expiration` |
| `feat:` | Minor (`1.1.0`) | `feat(agents): add streaming support` |
| `BREAKING CHANGE:` | Major (`2.0.0`) | Footer in commit body |
| `perf:` | Patch (`1.0.1`) | `perf(tasks): optimize query` |

Commits with `chore:`, `docs:`, `style:`, `refactor:`, `test:` do **not** trigger a release.

### npm Trusted Publishing (OIDC)

The release job publishes to npm using **Trusted Publishing** — no `NPM_TOKEN` secret is needed. Instead:

1. The workflow requests an OIDC token from GitHub (`id-token: write` permission)
2. npm verifies the token matches the package's linked GitHub repository
3. npm publishes the package with a signed **provenance statement**

This is more secure than static tokens because:
- No long-lived secrets to rotate or leak
- Each publish is cryptographically tied to a specific workflow run
- Provenance is published to the [Sigstore transparency log](https://search.sigstore.dev/)

**Setup requirement**: The npm package must be linked to the GitHub repository via npm's Trusted Publishing settings at [npmjs.com](https://www.npmjs.com/).

### Semantic Release Plugins

The release pipeline uses these plugins (in order):

| Plugin | Purpose |
|--------|---------|
| `@semantic-release/commit-analyzer` | Determines version bump from commits |
| `@semantic-release/release-notes-generator` | Generates release notes |
| `@semantic-release/changelog` | Updates `CHANGELOG.md` |
| `@semantic-release/npm` | Publishes to npm registry |
| `@semantic-release/github` | Creates GitHub release |
| `@semantic-release/git` | Commits `CHANGELOG.md` and `package.json` back |

These are installed at runtime in the CI job (not in `devDependencies`) to avoid bundled transitive vulnerabilities from polluting `npm audit`.

## Gitleaks Workflow

[Gitleaks](https://github.com/gitleaks/gitleaks-action) scans the full git history for accidentally committed secrets (API keys, passwords, tokens). Runs on every push and PR to `main` and `alpha`.

## Supply Chain Security

### `.npmrc` Hardening

```ini
registry=https://registry.npmjs.org/
legacy-peer-deps=true
ignore-scripts=true
```

- **`registry`**: Pins to the official npm registry, preventing registry substitution attacks
- **`ignore-scripts=true`**: Blocks post-install scripts from running during `npm install`. This is a key defense against supply chain attacks where malicious packages execute code at install time

### Native Modules

Because `ignore-scripts=true` blocks all install scripts, native modules (like `sqlite3`, `bcrypt`) won't compile during `npm ci`. The CI workflow handles this with an explicit rebuild step:

```yaml
- name: Rebuild native modules
  run: npm rebuild --ignore-scripts=false
```

The `--ignore-scripts=false` flag overrides the `.npmrc` setting specifically for the rebuild step, allowing only the known native modules to compile.

### Socket.dev

[Socket.dev](https://socket.dev/) is a GitHub App that automatically scans pull requests for supply chain risks. Configured in `.github/socket.yml`:

- **Blocks**: malware, install scripts, shell/network access at install time, git/HTTP dependencies
- **Warns**: typosquatting, obfuscated code, telemetry, unresolved requires

Socket.dev scans all PRs on the repository regardless of target branch.

### Lockfile Integrity

The CI pipeline validates the lockfile with two checks:

1. **`lockfile-lint`**: Ensures all package URLs use HTTPS and resolve to the npm registry
2. **`npm audit signatures`**: Verifies that packages have valid registry signatures

### Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) runs these checks before every commit:

1. `npm run lint` — ESLint
2. `npm run test:all` — All tests
3. `lockfile-lint` — Lockfile integrity

## Troubleshooting

### Release didn't publish after a push

- Only `feat:`, `fix:`, `perf:`, and breaking change commits trigger releases
- Check that the `build-and-test` job passed — `release` depends on it
- The `release` job only runs on push events, not pull requests

### npm audit fails in CI

Use `npm overrides` in `package.json` to pin transitive dependencies to patched versions:

```json
"overrides": {
  "lodash": "^4.18.1"
}
```

Then run `npm install` to update `package-lock.json`.

### Native module errors in CI (e.g., sqlite3 not found)

The `npm rebuild --ignore-scripts=false` step must run after `npm ci`. If it fails, ensure `build-essential` and `python3` are installed in the runner.

### Lockfile-lint false positives

npm aliases (like `string-width-cjs`) can trigger false positives with `--validate-package-names`. The pipeline intentionally omits this flag.
