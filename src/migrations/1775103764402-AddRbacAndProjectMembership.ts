import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacAndProjectMembership1775103764402 implements MigrationInterface {
  name = 'AddRbacAndProjectMembership1775103764402';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`ALTER TABLE "temporary_tasks" RENAME TO "tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "project_members" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "projectId" varchar, "userId" varchar, CONSTRAINT "UQ_326b2a901eb18ac24eabc9b0581" UNIQUE ("projectId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08d1346ff91abba68e5a637cfd" ON "project_members" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "role" varchar NOT NULL DEFAULT ('user'), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_users"("id", "name", "email", "password", "createdAt", "updatedAt") SELECT "id", "name", "email", "password", "createdAt", "updatedAt" FROM "users"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "temporary_users" RENAME TO "users"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId" FROM "recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "recurrent_tasks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurrent_tasks" RENAME TO "recurrent_tasks"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`ALTER TABLE "temporary_tasks" RENAME TO "tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "recurrent_tasks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurrent_tasks" RENAME TO "recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_070d648bde98d061fd6e9d176d" ON "refresh_tokens" ("userId", "revokedAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_d19892d8f03928e5bfc7313780"`);
    await queryRunner.query(`DROP INDEX "IDX_08d1346ff91abba68e5a637cfd"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_project_members" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "projectId" varchar, "userId" varchar, CONSTRAINT "UQ_326b2a901eb18ac24eabc9b0581" UNIQUE ("projectId", "userId"), CONSTRAINT "FK_d19892d8f03928e5bfc7313780c" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_project_members"("id", "role", "createdAt", "projectId", "userId") SELECT "id", "role", "createdAt", "projectId", "userId" FROM "project_members"`,
    );
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_project_members" RENAME TO "project_members"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08d1346ff91abba68e5a637cfd" ON "project_members" ("userId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`);
    await queryRunner.query(`DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "recurrent_tasks"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurrent_tasks" RENAME TO "recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`);
    await queryRunner.query(`DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`);
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurrent_tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_08d1346ff91abba68e5a637cfd"`);
    await queryRunner.query(`DROP INDEX "IDX_d19892d8f03928e5bfc7313780"`);
    await queryRunner.query(
      `ALTER TABLE "project_members" RENAME TO "temporary_project_members"`,
    );
    await queryRunner.query(
      `CREATE TABLE "project_members" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "projectId" varchar, "userId" varchar, CONSTRAINT "UQ_326b2a901eb18ac24eabc9b0581" UNIQUE ("projectId", "userId"))`,
    );
    await queryRunner.query(
      `INSERT INTO "project_members"("id", "role", "createdAt", "projectId", "userId") SELECT "id", "role", "createdAt", "projectId", "userId" FROM "temporary_project_members"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_project_members"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_08d1346ff91abba68e5a637cfd" ON "project_members" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_070d648bde98d061fd6e9d176d"`);
    await queryRunner.query(`DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`);
    await queryRunner.query(`DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`);
    await queryRunner.query(`DROP INDEX "IDX_f5bb7be33ddb87ac0f04807b4a"`);
    await queryRunner.query(`DROP INDEX "IDX_a27865a7be17886e3088f4a650"`);
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurrent_tasks"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`ALTER TABLE "tasks" RENAME TO "temporary_tasks"`);
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurrent_tasks"("id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId") SELECT "id", "title", "description", "status", "priority", "cronExpression", "createdAt", "updatedAt", "assigneeId" FROM "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurrent_tasks"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME TO "temporary_users"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `INSERT INTO "users"("id", "name", "email", "password", "createdAt", "updatedAt") SELECT "id", "name", "email", "password", "createdAt", "updatedAt" FROM "temporary_users"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_users"`);
    await queryRunner.query(`DROP INDEX "IDX_08d1346ff91abba68e5a637cfd"`);
    await queryRunner.query(`DROP INDEX "IDX_d19892d8f03928e5bfc7313780"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`ALTER TABLE "tasks" RENAME TO "temporary_tasks"`);
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
  }
}
