# Last Name Schema Design

**Goal:** Add a required `last_name` field to users, keep existing `name` intact, and make both fresh and existing databases support the updated schema safely.

**Approach:** Introduce `last_name` as a new required column on `users`, update the backend and UI contracts that create or edit users, and ship a dedicated cross-database migration for existing installs. Existing rows will be backfilled from the current `name` value during migration so the new non-null constraint can be enforced without manual data prep.

**Key decisions**
- Keep the existing `name` column unchanged.
- Add a required `last_name` column.
- Backfill existing users with `last_name = name` during migration.
- Update the original schema migration so new databases create `users.last_name` from the start.

**Files expected to change**
- `src/users/entities/user.entity.ts`
- `src/auth/dto/register.dto.ts`
- `src/users/dto/create-user.dto.ts`
- `src/users/dto/update-user.dto.ts`
- `src/auth/dto/update-profile.dto.ts`
- `src/auth/auth.service.ts`
- `scripts/seed-admin.ts`
- `src/migrations/1774746981348-InitialSchemaAndSeed.ts`
- `src/migrations/<new migration>.ts`
- related backend, UI, and E2E tests

**Validation**
- Run `npm run lint`
- Run `npm audit`
- Run `npm run test:all`
- Run `npm run build:all`
