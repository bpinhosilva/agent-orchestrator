# Last Name Schema Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add required `last_name` support to the user model and keep both existing and fresh databases compatible.

**Architecture:** The change keeps the existing `name` column and introduces a new required `last_name` column. Runtime code will require `last_name` anywhere users are created or updated, while a dedicated cross-database migration backfills existing rows and the initial schema migration is updated so new installs create the column immediately.

**Tech Stack:** NestJS 11, TypeScript 5, TypeORM 0.3, PostgreSQL, SQLite, React, Vitest, Jest

---

### Task 1: Update user model contracts

**Files:**
- Modify: `src/users/entities/user.entity.ts`
- Modify: `src/auth/dto/register.dto.ts`
- Modify: `src/users/dto/create-user.dto.ts`
- Modify: `src/users/dto/update-user.dto.ts`
- Modify: `src/auth/dto/update-profile.dto.ts`

**Step 1: Write the failing test**

Use existing auth/user tests to require `last_name` on register and update payloads.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/auth/auth.service.spec.ts`
Expected: FAIL where required DTO/model fields are incomplete.

**Step 3: Write minimal implementation**

Add `last_name` to the entity and DTOs, keeping update DTO semantics optional where appropriate.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/auth/auth.service.spec.ts`
Expected: PASS

### Task 2: Update creation and profile flows

**Files:**
- Modify: `src/auth/auth.service.ts`
- Modify: `scripts/seed-admin.ts`
- Modify: `ui/src/api/auth.ts`
- Modify: `ui/src/api/users.ts`
- Modify: `ui/src/contexts/AuthContext.tsx`
- Modify: `ui/src/contexts/AuthContextInstance.ts`
- Modify: `ui/src/pages/Register.tsx`
- Modify: `ui/src/pages/Profile.tsx`
- Modify: `ui/src/components/TopAppBar.tsx`

**Step 1: Write the failing test**

Extend focused auth/UI tests so register/profile data includes `last_name`.

**Step 2: Run test to verify it fails**

Run: `npm --prefix ui run test -- src/contexts/AuthContext.test.tsx`
Expected: FAIL because payloads and user shape do not include `last_name`.

**Step 3: Write minimal implementation**

Pass `last_name` through backend and UI flows, and render user names consistently.

**Step 4: Run test to verify it passes**

Run: `npm --prefix ui run test -- src/contexts/AuthContext.test.tsx`
Expected: PASS

### Task 3: Update migrations

**Files:**
- Modify: `src/migrations/1774746981348-InitialSchemaAndSeed.ts`
- Create: `src/migrations/<timestamp>-AddUserLastName.ts`

**Step 1: Write the failing test**

Use the E2E suite and local migration flow as regression coverage for schema creation and startup.

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- test/app.e2e-spec.ts`
Expected: FAIL if runtime code expects `last_name` but schema does not include it.

**Step 3: Write minimal implementation**

Add `last_name` to the initial `users` table definition and create a cross-database migration that adds the column and backfills `last_name = name` before enforcing the required column.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- test/app.e2e-spec.ts`
Expected: PASS

### Task 4: Verify and stabilize

**Files:**
- Modify: related `*.spec.ts`, `*.test.tsx`, and `test/*.e2e-spec.ts` files as needed

**Step 1: Run focused tests**

Run: `npm test -- src/auth/auth.service.spec.ts`
Expected: PASS

**Step 2: Run UI tests**

Run: `npm --prefix ui run test`
Expected: PASS

**Step 3: Run repository verification**

Run: `npm run lint && npm audit && npm run test:all && npm run build:all`
Expected: PASS
