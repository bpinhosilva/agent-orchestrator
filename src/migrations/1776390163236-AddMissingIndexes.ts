import { MigrationInterface, QueryRunner } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';
import { normalizeMigrationSqlForDriver } from '../database/migration-sql.utils';

export class AddMissingIndexes1776390163236 implements MigrationInterface {
  name = 'AddMissingIndexes1776390163236';

  private async execute(queryRunner: QueryRunner, sql: string): Promise<void> {
    await queryRunner.query(
      normalizeMigrationSqlForDriver(queryRunner.connection.options.type, sql),
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);

    if (!isSqlite) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_d19892d8f03928e5bfc7313780"`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_603379383366b71239acc25e26" ON "users" ("createdAt", "id")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_1339457cf4c2424ec8ddd6678a" ON "tasks" ("projectId", "status", "priority")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_9ec101b70a5f9612b0757d87c8" ON "recurrent_tasks" ("assigneeId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_6755ac981ae6d51a135f2ead5d" ON "recurrent_tasks" ("projectId", "updatedAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_96d8e0300e884502e0382f67bb" ON "recurrent_task_execs" ("recurrentTaskId", "updatedAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_f076c050d237e20ec9335cdeff" ON "recurrent_task_execs" ("recurrentTaskId", "createdAt")`,
      );
      return;
    }

    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_d19892d8f03928e5bfc7313780"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_7a097552fe4fba313996835706"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "costEstimate" float NOT NULL DEFAULT (0), "llmLatency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "tasks"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_tasks" RENAME TO "tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "recurrent_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "recurrent_tasks"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_recurrent_tasks" RENAME TO "recurrent_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_7a097552fe4fba313996835706"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "costEstimate" float NOT NULL DEFAULT (0), "llmLatency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "tasks"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_tasks" RENAME TO "tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "recurrent_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "recurrent_tasks"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_recurrent_tasks" RENAME TO "recurrent_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_603379383366b71239acc25e26" ON "users" ("createdAt", "id") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_1339457cf4c2424ec8ddd6678a" ON "tasks" ("projectId", "status", "priority") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_9ec101b70a5f9612b0757d87c8" ON "recurrent_tasks" ("assigneeId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_6755ac981ae6d51a135f2ead5d" ON "recurrent_tasks" ("projectId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_96d8e0300e884502e0382f67bb" ON "recurrent_task_execs" ("recurrentTaskId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_f076c050d237e20ec9335cdeff" ON "recurrent_task_execs" ("recurrentTaskId", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);

    if (!isSqlite) {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_f076c050d237e20ec9335cdeff"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_96d8e0300e884502e0382f67bb"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_6755ac981ae6d51a135f2ead5d"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_9ec101b70a5f9612b0757d87c8"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_1339457cf4c2424ec8ddd6678a"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "IDX_603379383366b71239acc25e26"`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId")`,
      );
      return;
    }

    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_f076c050d237e20ec9335cdeff"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_96d8e0300e884502e0382f67bb"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_6755ac981ae6d51a135f2ead5d"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_9ec101b70a5f9612b0757d87c8"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_1339457cf4c2424ec8ddd6678a"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_603379383366b71239acc25e26"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_recurrent_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_recurrent_tasks"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_7a097552fe4fba313996835706"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "tasks" RENAME TO "temporary_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "costEstimate" float NOT NULL DEFAULT (0), "llmLatency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_tasks"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_recurrent_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_recurrent_tasks"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_7a097552fe4fba313996835706"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "tasks" RENAME TO "temporary_tasks"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "costEstimate" float NOT NULL DEFAULT (0), "llmLatency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "costEstimate", "llmLatency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_tasks"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId") `,
    );
  }
}
