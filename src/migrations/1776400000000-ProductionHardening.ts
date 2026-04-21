import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionHardening1776400000000 implements MigrationInterface {
  name = 'ProductionHardening1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite =
      queryRunner.connection.options.type === 'sqlite' ||
      queryRunner.connection.options.type === 'better-sqlite3';

    if (isSqlite) {
      // ─── recurrent_tasks: assigneeId → nullable + SET NULL ───────────────
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_9ec101b70a5f9612b0757d87c8"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_a03520bcf60ada1a46bf548e22"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_0f9f543bd40419122e69aeff00"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_6755ac981ae6d51a135f2ead5d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" RENAME TO "recurrent_tasks_old"`,
      );
      await queryRunner.query(
        `CREATE TABLE "recurrent_tasks" (` +
          `"id" varchar PRIMARY KEY NOT NULL, ` +
          `"title" varchar NOT NULL, ` +
          `"description" text NOT NULL, ` +
          `"status" varchar CHECK("status" IN ('active','paused','error')) NOT NULL DEFAULT ('active'), ` +
          `"priority" varchar CHECK("priority" IN ('0','1','2','3')) NOT NULL DEFAULT (2), ` +
          `"cronExpression" varchar NOT NULL, ` +
          `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
          `"updatedAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
          `"assigneeId" varchar, ` +
          `"projectId" varchar, ` +
          `CONSTRAINT "FK_recurrent_tasks_project" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, ` +
          `CONSTRAINT "FK_recurrent_tasks_assignee" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION` +
          `)`,
      );
      await queryRunner.query(
        `INSERT INTO "recurrent_tasks" SELECT * FROM "recurrent_tasks_old"`,
      );
      await queryRunner.query(`DROP TABLE "recurrent_tasks_old"`);
      await queryRunner.query(
        `CREATE INDEX "IDX_9ec101b70a5f9612b0757d87c8" ON "recurrent_tasks" ("assigneeId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_6755ac981ae6d51a135f2ead5d" ON "recurrent_tasks" ("projectId", "updatedAt")`,
      );

      // ─── recurrent_task_execs: fix FK to point to new recurrent_tasks ──────
      // Drop existing indexes so they can be recreated against the rebuilt table
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_f5bb7be33ddb87ac0f04807b4a"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_f076c050d237e20ec9335cdeff"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_96d8e0300e884502e0382f67bb"`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_task_execs" RENAME TO "recurrent_task_execs_old"`,
      );
      await queryRunner.query(
        `CREATE TABLE "recurrent_task_execs" (` +
          `"id" varchar PRIMARY KEY NOT NULL, ` +
          `"status" varchar CHECK("status" IN ('running','success','failure','canceled')) NOT NULL DEFAULT ('running'), ` +
          `"result" text, ` +
          `"latencyMs" integer, ` +
          `"artifacts" text, ` +
          `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
          `"updatedAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
          `"recurrentTaskId" varchar NOT NULL, ` +
          `CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION` +
          `)`,
      );
      await queryRunner.query(
        `INSERT INTO "recurrent_task_execs" ("id", "status", "result", "latencyMs", "artifacts", "createdAt", "updatedAt", "recurrentTaskId") ` +
          `SELECT "id", "status", "result", "latencyMs", "artifacts", "createdAt", "updatedAt", "recurrentTaskId" FROM "recurrent_task_execs_old"`,
      );
      await queryRunner.query(`DROP TABLE "recurrent_task_execs_old"`);
      await queryRunner.query(
        `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_f076c050d237e20ec9335cdeff" ON "recurrent_task_execs" ("recurrentTaskId", "createdAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_96d8e0300e884502e0382f67bb" ON "recurrent_task_execs" ("recurrentTaskId", "updatedAt")`,
      );

      // ─── project_members: enforce NOT NULL on projectId and userId ────────
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_d19892d8f03928e5bfc7313780"`,
      );
      await queryRunner.query(
        `ALTER TABLE "project_members" RENAME TO "project_members_old"`,
      );
      await queryRunner.query(
        `CREATE TABLE "project_members" (` +
          `"id" varchar PRIMARY KEY NOT NULL, ` +
          `"role" varchar NOT NULL DEFAULT ('member'), ` +
          `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
          `"projectId" varchar NOT NULL, ` +
          `"userId" varchar NOT NULL, ` +
          `CONSTRAINT "UQ_project_members_project_user" UNIQUE ("projectId", "userId"), ` +
          `CONSTRAINT "FK_project_members_project" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, ` +
          `CONSTRAINT "FK_project_members_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION` +
          `)`,
      );
      await queryRunner.query(
        `INSERT INTO "project_members" SELECT * FROM "project_members_old" WHERE "projectId" IS NOT NULL AND "userId" IS NOT NULL`,
      );
      await queryRunner.query(`DROP TABLE "project_members_old"`);
      await queryRunner.query(
        `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_project_members_userId" ON "project_members" ("userId")`,
      );

      // ─── refresh_tokens: add index on absoluteExpiry ──────────────────────
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_absoluteExpiry" ON "refresh_tokens" ("absoluteExpiry")`,
      );
    } else {
      // ─── PostgreSQL ──────────────────────────────────────────────────────

      // recurrent_tasks: drop old FK, add nullable assigneeId with SET NULL
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" DROP CONSTRAINT IF EXISTS "FK_9ec101b70a5f9612b0757d87c83"`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" ALTER COLUMN "assigneeId" DROP NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" ADD CONSTRAINT "FK_recurrent_tasks_assignee" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );

      // project_members: enforce NOT NULL (safe if no NULL data exists)
      await queryRunner.query(
        `ALTER TABLE "project_members" ALTER COLUMN "projectId" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "project_members" ALTER COLUMN "userId" SET NOT NULL`,
      );

      // refresh_tokens: add index on absoluteExpiry
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_absoluteExpiry" ON "refresh_tokens" ("absoluteExpiry")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSqlite =
      queryRunner.connection.options.type === 'sqlite' ||
      queryRunner.connection.options.type === 'better-sqlite3';

    if (isSqlite) {
      await queryRunner.query(`PRAGMA foreign_keys = OFF`);
      try {
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_refresh_tokens_absoluteExpiry"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_project_members_userId"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_d19892d8f03928e5bfc7313780"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_9ec101b70a5f9612b0757d87c8"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_a03520bcf60ada1a46bf548e22"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_0f9f543bd40419122e69aeff00"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_6755ac981ae6d51a135f2ead5d"`,
        );

        // Restore recurrent_task_execs to its pre-ProductionHardening shape.
        // The FK must point to `recurrent_tasks` (which still exists in the DB at
        // this point in the down() path — we have not yet renamed it).
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_96d8e0300e884502e0382f67bb"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_f076c050d237e20ec9335cdeff"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_f5bb7be33ddb87ac0f04807b4a"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_1a2b3c4d5e6f7a8b9c0d1e2f3a"`,
        );
        await queryRunner.query(
          `DROP INDEX IF EXISTS "IDX_4a1b8f1e0c2d3e4f5a6b7c8d9e"`,
        );
        await queryRunner.query(
          `ALTER TABLE "recurrent_task_execs" RENAME TO "recurrent_task_execs_new"`,
        );
        await queryRunner.query(
          `CREATE TABLE "recurrent_task_execs" (` +
            `"id" varchar PRIMARY KEY NOT NULL, ` +
            `"status" varchar CHECK("status" IN ('running','success','failure','canceled')) NOT NULL DEFAULT ('running'), ` +
            `"result" text, ` +
            `"latencyMs" integer, ` +
            `"artifacts" text, ` +
            `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
            `"updatedAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
            `"recurrentTaskId" varchar NOT NULL, ` +
            `CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION` +
            `)`,
        );
        await queryRunner.query(
          `INSERT INTO "recurrent_task_execs" ("id", "status", "result", "latencyMs", "artifacts", "createdAt", "updatedAt", "recurrentTaskId") ` +
            `SELECT "id", "status", "result", "latencyMs", "artifacts", "createdAt", "updatedAt", "recurrentTaskId" FROM "recurrent_task_execs_new"`,
        );
        await queryRunner.query(`DROP TABLE "recurrent_task_execs_new"`);
        await queryRunner.query(
          `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_f076c050d237e20ec9335cdeff" ON "recurrent_task_execs" ("recurrentTaskId", "createdAt")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_96d8e0300e884502e0382f67bb" ON "recurrent_task_execs" ("recurrentTaskId", "updatedAt")`,
        );
        // Restore recurrent_tasks with NOT NULL assigneeId + CASCADE
        await queryRunner.query(
          `ALTER TABLE "recurrent_tasks" RENAME TO "recurrent_tasks_new"`,
        );
        await queryRunner.query(
          `CREATE TABLE "recurrent_tasks" (` +
            `"id" varchar PRIMARY KEY NOT NULL, ` +
            `"title" varchar NOT NULL, ` +
            `"description" text NOT NULL, ` +
            `"status" varchar CHECK("status" IN ('active','paused','error')) NOT NULL DEFAULT ('active'), ` +
            `"priority" varchar CHECK("priority" IN ('0','1','2','3')) NOT NULL DEFAULT (2), ` +
            `"cronExpression" varchar NOT NULL, ` +
            `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
            `"updatedAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
            `"assigneeId" varchar NOT NULL, ` +
            `"projectId" varchar, ` +
            `CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, ` +
            `CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION` +
            `)`,
        );
        await queryRunner.query(
          `INSERT INTO "recurrent_tasks" SELECT * FROM "recurrent_tasks_new" WHERE "assigneeId" IS NOT NULL`,
        );
        await queryRunner.query(`DROP TABLE "recurrent_tasks_new"`);
        await queryRunner.query(
          `CREATE INDEX "IDX_9ec101b70a5f9612b0757d87c8" ON "recurrent_tasks" ("assigneeId")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_6755ac981ae6d51a135f2ead5d" ON "recurrent_tasks" ("projectId", "updatedAt")`,
        );
        // Restore project_members (nullable columns — SQLite can't remove NOT NULL without rebuild)
        await queryRunner.query(
          `ALTER TABLE "project_members" RENAME TO "project_members_new"`,
        );
        await queryRunner.query(
          `CREATE TABLE "project_members" (` +
            `"id" varchar PRIMARY KEY NOT NULL, ` +
            `"role" varchar NOT NULL DEFAULT ('member'), ` +
            `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
            `"projectId" varchar, ` +
            `"userId" varchar, ` +
            `CONSTRAINT "UQ_project_members_project_user" UNIQUE ("projectId", "userId"), ` +
            `CONSTRAINT "FK_project_members_project" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, ` +
            `CONSTRAINT "FK_project_members_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION` +
            `)`,
        );
        await queryRunner.query(
          `INSERT INTO "project_members" SELECT * FROM "project_members_new"`,
        );
        await queryRunner.query(`DROP TABLE "project_members_new"`);
        await queryRunner.query(
          `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId")`,
        );
        await queryRunner.query(
          `CREATE INDEX "IDX_project_members_userId" ON "project_members" ("userId")`,
        );
      } finally {
        await queryRunner.query(`PRAGMA foreign_keys = ON`);
      }
    } else {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_refresh_tokens_absoluteExpiry"`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" DROP CONSTRAINT IF EXISTS "FK_recurrent_tasks_assignee"`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" ALTER COLUMN "assigneeId" SET NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_tasks" ADD CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "project_members" ALTER COLUMN "projectId" DROP NOT NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "project_members" ALTER COLUMN "userId" DROP NOT NULL`,
      );
    }
  }
}
