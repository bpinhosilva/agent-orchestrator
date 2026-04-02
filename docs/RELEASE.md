# Release

Releases are automated with semantic-release from `.github/workflows/ci.yml` and `.releaserc.json`.

## Branch policy

| Branch | Type | npm tag | Example |
| --- | --- | --- | --- |
| `main` | Stable | `latest` | `1.2.0` |
| `alpha` | Prerelease | `alpha` | `1.2.0-alpha.3` |

## Triggering a release

On push to `main` or `alpha`, if CI passes, semantic-release inspects commit messages since last release.

Release-worthy commit types:

- `feat:` → minor
- `fix:` → patch
- `perf:` → patch
- `BREAKING CHANGE:` → major

Common non-release types (`docs:`, `test:`, `chore:`, etc.) do not publish a new version.

## What semantic-release updates

When a release is created, semantic-release:

1. Computes the next version
2. Updates `CHANGELOG.md`
3. Publishes to npm
4. Creates a GitHub release
5. Commits updated `CHANGELOG.md` and `package.json`

## Trusted publishing

The release job requests a GitHub OIDC token (`id-token: write`) and publishes to npm via Trusted Publishing, avoiding static npm tokens.

## Manual release nudge

If you need to force a release cycle, push a release-eligible commit (for example, an empty `fix:` commit):

```bash
git commit --allow-empty -m "fix: trigger release"
git push origin alpha
```
