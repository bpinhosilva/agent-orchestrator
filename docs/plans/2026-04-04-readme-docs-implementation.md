# README and Docs Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh `README.md` and the existing `docs/` pages so first-time users can get the project running quickly and contributors can trust the reference material.

**Architecture:** Keep `README.md` as the onboarding entry point and keep `docs/CLI.md`, `docs/CI_CD.md`, and `docs/RELEASE.md` as focused reference documents. Update content from the current codebase and scripts, separate shipped capabilities from roadmap items, and reduce duplicated detail by linking to the canonical page for each topic.

**Tech Stack:** Markdown documentation, Node.js/npm scripts, NestJS backend, React UI, Docker Compose, packaged CLI/runtime

---

### Task 1: Reconfirm the source of truth for documentation

**Files:**
- Inspect: `package.json`
- Inspect: `README.md`
- Inspect: `docs/CLI.md`
- Inspect: `docs/CI_CD.md`
- Inspect: `docs/RELEASE.md`
- Inspect: `src/app.module.ts`
- Inspect: `src/main.ts`
- Inspect: `src/config/typeorm.ts`
- Inspect: `src/config/runtime-paths.ts`
- Inspect: `src/auth/auth.controller.ts`
- Inspect: `src/users/entities/user.entity.ts`
- Inspect: `src/projects/entities/project-member.entity.ts`
- Inspect: `.github/workflows/ci.yml`

**Step 1: Review package scripts and runtime behavior**

Read the listed files and write down the current commands, startup paths, and auth/role terminology that docs must match.

**Step 2: Identify README mismatches**

Make a short checklist of outdated statements, duplicated details, and missing onboarding guidance.

**Step 3: Identify `docs/` mismatches**

Check whether CLI, CI/CD, and release docs accurately describe the current repository behavior and where README should link instead of duplicate.

**Step 4: Commit**

```bash
git add docs/plans/2026-04-04-readme-docs-design.md docs/plans/2026-04-04-readme-docs-implementation.md
git commit -m "docs: add README refresh design and plan"
```

### Task 2: Rewrite `README.md` for first-run success

**Files:**
- Modify: `README.md`
- Reference: `package.json`
- Reference: `src/app.module.ts`
- Reference: `src/main.ts`
- Reference: `docs/CLI.md`

**Step 1: Update the overview and capabilities sections**

Rewrite the opening summary so it matches the current product, then split feature messaging into:

- current capabilities
- planned / in-progress direction

Make sure the text does not present unshipped workflow-builder or richer agent capability items as already available.

**Step 2: Tighten the setup and quick-start flow**

Rework quick start so the reader can clearly choose between:

- packaged CLI/runtime install
- source checkout development

Keep the commands aligned with the current scripts:

```bash
npm install
npm rebuild
npm run build:all
npm run dev
npm run start:dev
agent-orchestrator setup
agent-orchestrator run
```

**Step 3: Clarify database and Docker guidance**

Keep the SQLite default path, PostgreSQL path, and Docker entrypoints accurate, but remove detail that belongs in reference docs rather than onboarding.

**Step 4: Add a concise development workflow section**

Add a short section that points contributors to the most important commands:

```bash
npm run dev
npm run lint:all
npm run test:all
npm run build:all
```

**Step 5: Fix security and RBAC wording**

Document that:

- auth uses JWTs transported via httpOnly cookies
- system roles are separate from project membership roles
- routes are protected by default

**Step 6: Commit**

```bash
git add README.md
git commit -m "docs: refresh README onboarding"
```

### Task 3: Tighten `docs/CLI.md`

**Files:**
- Modify: `docs/CLI.md`
- Reference: `package.json`
- Reference: `src/cli/index.ts`

**Step 1: Keep CLI.md as the canonical command reference**

Preserve command coverage for `setup`, `run`, `status`, `logs`, `stop`, and `migrate`, but remove any ambiguity about whether a command is for packaged runtime use or source development.

**Step 2: Clarify source vs packaged usage**

Add or tighten wording so readers understand:

- the binary comes from the packaged build
- source checkout requires `npm run build:all` before using `agent-orchestrator`
- runtime files live under `AGENT_ORCHESTRATOR_HOME` when configured

**Step 3: Cross-link from README expectations**

Make sure the page works as the destination for deeper command details that README now links to.

**Step 4: Commit**

```bash
git add docs/CLI.md
git commit -m "docs: clarify CLI runtime usage"
```

### Task 4: Tighten contributor docs

**Files:**
- Modify: `docs/CI_CD.md`
- Modify: `docs/RELEASE.md`
- Reference: `.github/workflows/ci.yml`
- Reference: `.releaserc.json`

**Step 1: Align CI/CD doc with actual workflow**

Ensure the workflow triggers and checks match the current CI file and clearly state the local verification expectations contributors should use.

**Step 2: Tighten release doc wording**

Keep branch policy, semantic-release triggers, and trusted publishing details concise and current.

**Step 3: Improve cross-links**

Make sure README links cleanly into CLI/CI/release docs and those pages do not duplicate onboarding content unnecessarily.

**Step 4: Commit**

```bash
git add docs/CI_CD.md docs/RELEASE.md
git commit -m "docs: tighten contributor reference pages"
```

### Task 5: Validate the documentation set end-to-end

**Files:**
- Review: `README.md`
- Review: `docs/CLI.md`
- Review: `docs/CI_CD.md`
- Review: `docs/RELEASE.md`

**Step 1: Check every command and link**

Confirm that commands named in docs exist in `package.json`, referenced files still exist, and internal links point to the right documents.

**Step 2: Check onboarding flow**

Read `README.md` top to bottom and verify that a new user can understand:

- what the project does today
- how to install it
- how to run it
- where to go for deeper reference docs

**Step 3: Run the minimum verification needed**

Documentation-only edits do not require the full test suite, but if any example commands or references were changed to rely on scripts, verify those scripts exist and are named correctly.

**Step 4: Final commit**

```bash
git add README.md docs/CLI.md docs/CI_CD.md docs/RELEASE.md
git commit -m "docs: refresh project documentation"
```
