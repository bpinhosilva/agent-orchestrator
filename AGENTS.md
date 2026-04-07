# AI Agent Instructions for Agent Orchestrator

This document is for AI coding agents working in the Agent Orchestrator repository. It is intended to be a repo-accurate guide for how the project is currently built, tested, structured, and operated.

**Tech stack**: NestJS 11 + TypeScript 5 + TypeORM + PostgreSQL (prod) + SQLite (dev/runtime) + React SPA frontend  
**Node.js**: `>=24`

---

## Project overview

Agent Orchestrator is an open-source platform for managing and orchestrating AI agents across multiple providers.

### Current capabilities

- Multi-provider agent execution with **Google Gemini** and **Anthropic Claude**
- Task execution and recurring scheduling
- Project management with project membership and RBAC
- File uploads and storage-backed task workflows
- Packaged CLI/runtime for local installation and management
- React dashboard served by the backend or packaged runtime

### Active / planned areas

- Expanded workflow orchestration and agent chaining
- Broader agent capabilities such as richer tool integrations

When documenting features, prefer distinguishing **current behavior** from **planned direction** rather than presenting roadmap items as already complete.

---

## Verification checklist

Before handing off code changes, align with the current CI pipeline.

### CI-parity verification

```bash
npm audit --audit-level=high
npm run lint:all
npm run test:cov
npm run test:e2e
npm test --prefix ui
npm run build:all
```

### Minimum local verification

For smaller changes, these are still useful fast checks:

```bash
npm run lint:all
npm run test:all
```

### Notes

- CI also validates lockfile integrity and package signatures.
- Source installs use hardened npm settings; after `npm install` or `npm ci`, run:

```bash
npm rebuild
```

This is important for native modules such as `bcrypt` and `sqlite3`.

---

## Build, test, and development commands

### Development

```bash
npm run start:dev        # API only, watch mode
npm run dev              # API + UI dev servers
npm run build            # Nest backend build
npm run build:ui         # React UI build
npm run build:all        # Backend + UI packaged build
npm run format           # Prettier for src/ and test/
```

### Linting

```bash
npm run lint             # API lint with --fix
npm run lint:ui          # UI lint
npm run lint:all         # API + UI lint
```

### Testing

```bash
npm test                 # API unit/integration tests
npm run test:watch
npm run test:cov
npm run test:e2e
npm run test:ui
npm run test:all         # API + UI + E2E
```

### Running single tests

```bash
npm test -- src/auth/auth.service.spec.ts
npm test -- --testNamePattern="should validate email"
npm run test:e2e -- test/app.e2e-spec.ts
```

### Database and operational commands

```bash
npm run typeorm -- migration:generate src/migrations/DescriptiveName
npm run migration:run
npm run migration:revert
npm run schema:drop
npm run seed:admin
```

---

## Runtime and CLI

This project supports both **source checkout development** and a **packaged CLI/runtime**.

### Source checkout

```bash
git clone <repo> && cd agent-orchestrator
npm install
npm rebuild
npm run build:all
```

### Packaged CLI commands

The packaged CLI currently supports:

```bash
agent-orchestrator setup
agent-orchestrator run
agent-orchestrator status
agent-orchestrator logs
agent-orchestrator stop
agent-orchestrator restart
agent-orchestrator migrate
```

### Runtime paths

- Runtime configuration is loaded from `${AGENT_ORCHESTRATOR_HOME}/.env` when `AGENT_ORCHESTRATOR_HOME` is set.
- SQLite uses:
  - `${AGENT_ORCHESTRATOR_HOME}/local.sqlite` when runtime home is set
  - `local.sqlite` in the package/project root otherwise
- The packaged UI build lives at `dist/ui`
- The backend build entrypoint is `dist/main.js`

### Static UI serving

- `npm run build:all` builds the UI and copies it into `dist/ui`
- The Nest app serves:
  - `ui/dist` during source development
  - `dist/ui` in production builds
- Static serving can be disabled with `SERVE_STATIC_UI=false`

---

## Architecture overview

### Feature-oriented modules in `src/`

| Module | Purpose |
| --- | --- |
| `agents/` | Agent implementations, provider dispatch, registry |
| `auth/` | Authentication, JWT, refresh tokens, guards, decorators |
| `users/` | User management and system roles |
| `projects/` | Projects and project membership |
| `tasks/` | Tasks, scheduling (including recurrent tasks), orchestration, comments |
| `providers/` | Provider configuration |
| `models/` | AI model definitions and configuration |
| `uploads/` | File upload handling |
| `system-settings/` | System configuration (polling intervals, etc.) |
| `common/` | Shared services and filters |
| `config/` | Runtime paths, env validation, TypeORM config |
| `database/` | Migration state and startup migration checks |
| `migrations/` | TypeORM migrations |
| `cli/` | Packaged CLI/runtime entrypoint |

### Application shape

- Controllers handle HTTP concerns
- Services contain business logic and orchestration
- Persistence is handled through TypeORM repositories and entities
- Shared infrastructure is exported via `CommonModule`

### Key backend behavior

- API prefix: `api/v1`
- Global validation: `ValidationPipe({ transform: true, whitelist: true })`
- Global exception filter: `HttpExceptionFilter`
- Global guards:
  1. `ThrottlerGuard`
  2. `JwtAuthGuard`
  3. `RolesGuard`

---

## Authentication and authorization

### Authentication model

- JWT-based auth
- Access and refresh tokens are issued by `AuthService`
- Tokens are transported via **httpOnly cookies** in the controller layer
- Refresh tokens are hashed before being stored in the database

### Route protection

- Routes are protected by default through the global `JwtAuthGuard`
- Mark public routes with `@Public()`

```ts
@Public()
@Post('login')
login(...) { ... }
```

### Roles

There are **two distinct RBAC layers**:

1. **System roles** in `src/users/entities/user.entity.ts`
   - `admin`
   - `user`
2. **Project membership roles** in `src/projects/entities/project-member.entity.ts`
   - `owner`
   - `member`

Do not treat project membership as a substitute for system role checks; both are used.

### Rate limiting

- Global throttling defaults to `60/min`
- Auth endpoints override this selectively
  - `login`: `5/min`
  - `register`: `5/min`
  - `refresh`: `10/min`

---

## DTO, validation, and configuration conventions

### DTOs

- Use DTO classes with `class-validator`
- Rely on the global validation pipe for transformation and field whitelisting
- Unknown input fields are stripped automatically

### Environment access

- Validate environment via `src/config/env.validation.ts`
- Use `ConfigService` inside services/modules
- Avoid direct `process.env` access in application logic unless working specifically on bootstrap/runtime-path behavior

### Important environment variables

- `JWT_SECRET` (required, min 32 chars)
- `JWT_REFRESH_SECRET` (required, min 32 chars)
- `DATABASE_URL`
- `DB_TYPE` (`postgres` or `sqlite`)
- `PORT`
- `NODE_ENV`
- `ALLOWED_ORIGINS`
- `SCHEDULER_ENABLED`
- `DB_LOGGING`
- `SERVE_STATIC_UI`
- `CHECK_PENDING_MIGRATIONS_ON_STARTUP`

---

## Agents and provider registry

Agent implementations are registered through a registry decorator.

### Current registry files

- `src/agents/registry/agent.registry.ts`
- `src/agents/implementations/gemini.agent.ts`
- `src/agents/implementations/claude.agent.ts`

### Pattern

1. Implement the `Agent` interface
2. Register with `@RegisterAgent('provider-name')`
3. Resolve implementations through `getAgentImplementation(provider)`

Example:

```ts
import { Agent } from '../interfaces/agent.interface';
import { RegisterAgent } from '../registry/agent.registry';

@RegisterAgent('new-provider')
export class NewProviderAgent implements Agent {
  getName(): string {
    return 'New Provider';
  }
}
```

---

## Database and migrations

### Database behavior

- `synchronize` is disabled in normal app/runtime configuration
- Production uses PostgreSQL through `DATABASE_URL`
- Development/runtime can use SQLite

### Migration guidance

Use cross-database-safe TypeORM migrations whenever possible.

#### Preferred approach

Use TypeORM schema APIs such as:

- `createTable`
- `addColumn`
- `changeColumn`
- `createForeignKey`

Avoid raw SQL unless necessary and safe across both SQLite and PostgreSQL.

#### Timestamp defaults

SQLite and PostgreSQL differ in timestamp default syntax. If hand-writing migrations, branch by driver when needed.

#### Migration generation

Use:

```bash
npm run typeorm -- migration:generate src/migrations/DescriptiveName
```

Do not rely on the older hard-coded `npm run migration:generate -- src/migrations/MigrationName` example as if it produced arbitrary file names by itself; the underlying TypeORM command is the more accurate reference.

### Startup migration checks

The app can refuse startup when pending migrations exist if:

```bash
CHECK_PENDING_MIGRATIONS_ON_STARTUP=true
```

That logic lives in `src/database/migration-state.ts`.

---

## Testing guidance

The repository uses Jest for API and E2E tests, plus separate UI tests.

### Current patterns

- API tests run with `maxWorkers: 1`
- E2E tests create isolated temp runtime homes under the OS temp directory
- E2E tests currently synchronize the schema inside test setup

### What to cover

- Success and failure paths
- Auth and permission boundaries
- DTO validation behavior
- Project membership access checks
- Provider/agent selection logic

### Practical testing split

- **Service specs**: business logic
- **Controller specs**: route wiring and response behavior
- **E2E**: auth, security, and integration flows
- **UI tests**: frontend behavior in `ui/`

---

## Exception handling and security

### Exception filter

`HttpExceptionFilter` returns responses in this general shape:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": ["details"],
  "timestamp": "2024-03-30T00:00:00.000Z",
  "path": "/api/v1/resource"
}
```

### Security posture

- Helmet enabled with a tuned CSP
- CORS driven by `ALLOWED_ORIGINS`
- Swagger enabled outside production
- Refresh tokens stored hashed
- Runtime `.env` files are written with restrictive permissions by the CLI

---

## Common development tasks

### Adding an API endpoint

1. Add or update DTOs and tests
2. Implement controller/service changes in the feature module
3. Add E2E coverage when auth, validation, or integration behavior changes
4. Run CI-parity verification or an appropriate subset

### Adding an AI provider

1. Add the implementation under `src/agents/implementations/`
2. Register it with `@RegisterAgent(...)`
3. Extend configuration/env validation if needed
4. Add focused tests for provider selection and behavior

### Changing the schema

1. Update entities
2. Generate or write a migration
3. Review it for PostgreSQL + SQLite compatibility
4. Run migrations and tests

---

## Common gotchas

1. `JWT_SECRET` must be at least 32 characters
2. Source installs usually need `npm rebuild`
3. The packaged runtime expects both `dist/main.js` and `dist/ui/index.html`
4. UI assets are in `dist/ui`, not `dist/public`
5. `@Public()` is required for unauthenticated routes because auth is globally enforced
6. System roles and project membership roles are separate concerns
7. TypeORM `synchronize` is not the normal migration strategy for the app
8. Static UI serving is configurable with `SERVE_STATIC_UI`

---

## Quick reference structure

```text
agent-orchestrator/
├── src/
│   ├── agents/
│   ├── auth/
│   ├── cli/
│   ├── common/
│   ├── config/
│   ├── database/
│   ├── migrations/
│   ├── models/
│   ├── projects/
│   ├── providers/
│   ├── tasks/
│   ├── uploads/
│   └── users/
├── test/
├── ui/
├── package.json
├── README.md
└── AGENTS.md
```

---

## Recommended source files to inspect first

When working on a task, these files are often the best starting points:

- `package.json`
- `README.md`
- `src/app.module.ts`
- `src/main.ts`
- `src/config/env.validation.ts`
- `src/config/typeorm.ts`
- `src/config/runtime-paths.ts`
- `src/database/migration-state.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/agents/registry/agent.registry.ts`

Keep this file aligned with the repo as implementation evolves. If the code and this document disagree, prefer the code and update this file.
