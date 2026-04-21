import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Hotfix for installations that already ran the buggy ProductionHardening
 * migration.
 *
 * The original ProductionHardening SQLite `up()` recreated `recurrent_tasks`
 * but did NOT recreate `recurrent_task_execs`. With `PRAGMA foreign_keys = OFF`
 * (the state migrations run under), the `ALTER TABLE ... RENAME` does not
 * update FKs in other tables, so `recurrent_task_execs` was left with a FK
 * pointing to `recurrent_tasks_old` — a table that was then dropped. Any
 * INSERT into `recurrent_task_execs` then fails with
 * `SqliteError: no such table: main.recurrent_tasks_old`.
 *
 * This hotfix:
 *   • On SQLite, detects the broken FK (by inspecting `foreign_key_list`),
 *     and rebuilds `recurrent_task_execs` with a correct FK pointing to
 *     `recurrent_tasks`, using the canonical schema (FK/index names and the
 *     status CHECK constraint).
 *   • On PostgreSQL, does nothing: the PG path of ProductionHardening never
 *     touched `recurrent_task_execs`, so no correction is required.
 *
 * The migration is idempotent: on a fresh install where ProductionHardening
 * has been updated to also rebuild `recurrent_task_execs` correctly, this
 * migration detects no broken FK and no-ops.
 */
export class FixRecurrentTaskExecsForeignKey1776401000000 implements MigrationInterface {
  name = 'FixRecurrentTaskExecsForeignKey1776401000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite =
      queryRunner.connection.options.type === 'sqlite' ||
      queryRunner.connection.options.type === 'better-sqlite3';

    if (!isSqlite) {
      // PostgreSQL never exhibited this bug — nothing to do.
      return;
    }

    // Detect whether the FK on recurrent_task_execs still points to the
    // dropped `recurrent_tasks_old` table. Only rebuild when it does.
    const fks = (await queryRunner.query(
      `PRAGMA foreign_key_list("recurrent_task_execs")`,
    )) as Array<{ table: string; from: string }>;

    const hasBrokenFk = fks.some((fk) => fk.table === 'recurrent_tasks_old');

    if (!hasBrokenFk) {
      return;
    }

    await queryRunner.query(`PRAGMA foreign_keys = OFF`);
    try {
      // Drop every index we may have created on this table across the
      // historical schema revisions, so CREATE INDEX below never collides.
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
        `DROP INDEX IF EXISTS "IDX_4a1b8f1e0c2d3e4f5a6b7c8d9e"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_1a2b3c4d5e6f7a8b9c0d1e2f3a"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_2b3c4d5e6f7a8b9c0d1e2f3a4b"`,
      );

      await queryRunner.query(
        `ALTER TABLE "recurrent_task_execs" RENAME TO "recurrent_task_execs_broken"`,
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

      // Only copy rows whose recurrentTaskId still resolves — any orphans
      // would have been unreachable under the broken FK anyway.
      await queryRunner.query(
        `INSERT INTO "recurrent_task_execs" ("id", "status", "result", "latencyMs", "artifacts", "createdAt", "updatedAt", "recurrentTaskId") ` +
          `SELECT b."id", b."status", b."result", b."latencyMs", b."artifacts", b."createdAt", b."updatedAt", b."recurrentTaskId" ` +
          `FROM "recurrent_task_execs_broken" b ` +
          `WHERE b."recurrentTaskId" IS NOT NULL ` +
          `AND EXISTS (SELECT 1 FROM "recurrent_tasks" r WHERE r."id" = b."recurrentTaskId")`,
      );

      await queryRunner.query(`DROP TABLE "recurrent_task_execs_broken"`);

      await queryRunner.query(
        `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_f076c050d237e20ec9335cdeff" ON "recurrent_task_execs" ("recurrentTaskId", "createdAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_96d8e0300e884502e0382f67bb" ON "recurrent_task_execs" ("recurrentTaskId", "updatedAt")`,
      );
    } finally {
      await queryRunner.query(`PRAGMA foreign_keys = ON`);
    }
  }

  public async down(): Promise<void> {
    // Intentional no-op. The "pre-hotfix" state is a broken FK pointing to a
    // dropped table — there is no sensible way to recreate that, and doing so
    // would leave the database in an unusable state. Rolling back this
    // migration simply means "the FK stays correct".
  }
}
