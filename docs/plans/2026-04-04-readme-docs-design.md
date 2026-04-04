# README and docs refresh design

## Problem

The repository already has useful documentation, but the onboarding path is not as clear or as accurate as it should be for a first-time user. README mixes current behavior with planned features, duplicates detail that belongs in focused docs pages, and does not make the quickest successful setup path obvious enough.

## Goals

- Make `README.md` the best entry point for first-time users.
- Keep `docs/` as the deeper reference layer for CLI, CI/CD, and release workflows.
- Ensure setup, runtime, Docker, and contributor guidance match the current codebase and scripts.
- Distinguish current capabilities from planned direction.

## Chosen approach

Use a balanced documentation split:

- `README.md` covers project overview, current capabilities, planned direction, prerequisites, quick start, local development, Docker entrypoints, and where to find deeper docs.
- `docs/CLI.md` remains the canonical packaged CLI/runtime reference.
- `docs/CI_CD.md` remains contributor-facing and documents the actual CI expectations.
- `docs/RELEASE.md` remains maintainer-facing and focused on release automation.

## Planned README changes

1. Rewrite the opening summary to match the current project.
2. Replace the existing combined feature list with:
   - current capabilities
   - planned / in-progress direction
3. Tighten quick start so both source-checkout users and packaged CLI users can get running without ambiguity.
4. Keep SQLite and PostgreSQL setup guidance, but make the default path and decision points clearer.
5. Keep Docker coverage high level in README and push deeper command detail into focused docs where appropriate.
6. Add a short development workflow section with the most important scripts.
7. Fix wording around authorization so system roles and project membership roles are described accurately.

## Planned `docs/` changes

### `docs/CLI.md`

- Keep it as the detailed command reference.
- Make the distinction between packaged runtime usage and source development clearer.

### `docs/CI_CD.md`

- Ensure the documented CI checks align with the current workflow and local verification expectations.
- Keep it contributor-oriented instead of onboarding-focused.

### `docs/RELEASE.md`

- Tighten wording where needed so it reads as maintainer documentation.
- Keep release branching, semantic-release behavior, and trusted publishing details concise and accurate.

## Content rules for this refresh

- Prefer commands and behavior verified from the current repository over legacy wording.
- Avoid presenting roadmap items as already shipped.
- Keep one canonical source per topic and rely on links instead of duplication.
- Optimize for the first successful run, then for contributor discoverability.

## Verification

After the edits, the updated docs should be checked against the current scripts, runtime behavior, and docs cross-links so the onboarding path is internally consistent.
