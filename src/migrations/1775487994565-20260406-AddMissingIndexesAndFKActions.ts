import { MigrationInterface, QueryRunner } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';
import { normalizeMigrationSqlForDriver } from '../database/migration-sql.utils';

export class AddMissingIndexesAndFKActions20260406 implements MigrationInterface {
  name = '20260406AddMissingIndexesAndFKActions1775487994565';

  private async execute(queryRunner: QueryRunner, sql: string): Promise<void> {
    await queryRunner.query(
      normalizeMigrationSqlForDriver(queryRunner.connection.options.type, sql),
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!isSqliteDriver(queryRunner.connection.options.type)) {
      return;
    }

    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_ef998451a458221d3c409b3792"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_e927e225423f493fb58dc146cf"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, "emoji" varchar NOT NULL DEFAULT ('🧠'), "attributes" text, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes" FROM "agents"`,
    );
    await this.execute(queryRunner, `DROP TABLE "agents"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_agents" RENAME TO "agents"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
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
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
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
      `DROP INDEX "IDX_ef998451a458221d3c409b3792"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_e927e225423f493fb58dc146cf"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "temporary_agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, "emoji" text NOT NULL DEFAULT ('🧠'), "attributes" text, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes" FROM "agents"`,
    );
    await this.execute(queryRunner, `DROP TABLE "agents"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_agents" RENAME TO "agents"`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
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
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
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
      `CREATE TABLE "temporary_system_settings" ("id" varchar PRIMARY KEY NOT NULL, "data" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "temporary_system_settings"("id", "data", "createdAt", "updatedAt") SELECT "id", "data", "createdAt", "updatedAt" FROM "system_settings"`,
    );
    await this.execute(queryRunner, `DROP TABLE "system_settings"`);
    await this.execute(
      queryRunner,
      `ALTER TABLE "temporary_system_settings" RENAME TO "system_settings"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!isSqliteDriver(queryRunner.connection.options.type)) {
      return;
    }

    await this.execute(
      queryRunner,
      `ALTER TABLE "system_settings" RENAME TO "temporary_system_settings"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "system_settings" ("id" uuid PRIMARY KEY NOT NULL, "data" text NOT NULL, "createdAt" timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP))`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "system_settings"("id", "data", "createdAt", "updatedAt") SELECT "id", "data", "createdAt", "updatedAt" FROM "temporary_system_settings"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_system_settings"`);
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
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
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
      `DROP INDEX "IDX_e927e225423f493fb58dc146cf"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_ef998451a458221d3c409b3792"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "agents" RENAME TO "temporary_agents"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, "emoji" varchar NOT NULL DEFAULT ('🧠'), "attributes" text, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes" FROM "temporary_agents"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_agents"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
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
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
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
      `DROP INDEX "IDX_e927e225423f493fb58dc146cf"`,
    );
    await this.execute(
      queryRunner,
      `DROP INDEX "IDX_ef998451a458221d3c409b3792"`,
    );
    await this.execute(
      queryRunner,
      `ALTER TABLE "agents" RENAME TO "temporary_agents"`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, "emoji" varchar NOT NULL DEFAULT ('🧠'), "attributes" text, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `INSERT INTO "agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId", "emoji", "attributes" FROM "temporary_agents"`,
    );
    await this.execute(queryRunner, `DROP TABLE "temporary_agents"`);
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
    );
  }
}
