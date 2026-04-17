# Release

Releases are automated by the `release` job inside `.github/workflows/ci.yml` and configured by `.releaserc.json`.

## Branch policy

| Branch | Release type | npm tag | Example version |
| --- | --- | --- | --- |
| `main` | Stable | `latest` | `1.2.0` |
| `alpha` | Prerelease | `alpha` | `1.2.0-alpha.3` |

Prerelease versions on `alpha` automatically receive the `-alpha.N` suffix from semantic-release.

## When a release happens

On pushes to `main` or `alpha`, semantic-release inspects commit messages since the last release.

Release-worthy commit types:

- `feat:` -> minor
- `fix:` -> patch
- `perf:` -> patch
- `BREAKING CHANGE:` -> major

Common non-release types such as `docs:`, `test:`, and `chore:` do not publish a new version by themselves.

## What semantic-release updates

When a release is published, semantic-release:

1. Computes the next version
2. Updates `CHANGELOG.md`
3. Publishes to npm
4. Creates a GitHub release
5. Commits the updated release artifacts back to the repository

## Trusted publishing

The release job requests a GitHub OIDC token (`id-token: write`) and publishes to npm through Trusted Publishing. This avoids storing long-lived npm access tokens in repository secrets.

## If a release does not happen

- If CI fails, the release job does not run.
- If the pushed commits are not release-eligible, semantic-release exits without publishing a version.
- If you expect a release and do not get one, check the commit messages first.

## Manual release nudge

If you need to trigger a release cycle intentionally, push a release-eligible commit:

```bash
git commit --allow-empty -m "fix: trigger release"
git push origin alpha
```
