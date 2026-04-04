import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineSchema1775260737095 implements MigrationInterface {
  name = 'BaselineSchema1775260737095';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "last_name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar, "role" varchar NOT NULL DEFAULT ('user'), "avatar" varchar NOT NULL DEFAULT ('avatar-01'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "providers" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d735474e539e674ba3702eddc44" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "models" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce64b8d909a4385f26bcd363b" ON "models" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
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
      `CREATE TABLE "projects" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('planning','active','on_hold','completed','archived') ) NOT NULL DEFAULT ('planning'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "ownerAgentId" varchar)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cb68059ab1223de4f03f9a726" ON "projects" ("ownerAgentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "task_comments" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "authorType" varchar CHECK( "authorType" IN ('user','agent') ) NOT NULL, "artifacts" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "taskId" varchar NOT NULL, "authorUserId" varchar, "authorAgentId" varchar)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70a6d3ec52a15e0ff43d4ad353" ON "task_comments" ("authorUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0" ON "task_comments" ("authorAgentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a2203f600be90963a165d1432" ON "task_comments" ("taskId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL)`,
    );
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
      `CREATE TABLE "recurrent_task_execs" ("id" varchar PRIMARY KEY NOT NULL, "status" varchar CHECK( "status" IN ('running','success','failure','canceled') ) NOT NULL DEFAULT ('running'), "result" text, "latencyMs" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "recurrentTaskId" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9f543bd40419122e69aeff00" ON "recurrent_tasks" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a03520bcf60ada1a46bf548e22" ON "recurrent_tasks" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "artifacts" ("id" varchar PRIMARY KEY NOT NULL, "originalName" varchar NOT NULL, "mimeType" varchar NOT NULL, "filePath" varchar NOT NULL, "metadata" text)`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" text NOT NULL, "issuedAt" datetime NOT NULL DEFAULT (datetime('now')), "expiresAt" datetime NOT NULL, "absoluteExpiry" datetime NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "revokedAt" datetime)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_070d648bde98d061fd6e9d176d" ON "refresh_tokens" ("userId", "revokedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec511b89bba27b211e32a2a12f" ON "refresh_tokens" ("userId", "expiresAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_2ce64b8d909a4385f26bcd363b"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_models" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, CONSTRAINT "FK_2ce64b8d909a4385f26bcd363b3" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_models"("id", "name", "createdAt", "updatedAt", "providerId") SELECT "id", "name", "createdAt", "updatedAt", "providerId" FROM "models"`,
    );
    await queryRunner.query(`DROP TABLE "models"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_models" RENAME TO "models"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce64b8d909a4385f26bcd363b" ON "models" ("providerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_e927e225423f493fb58dc146cf"`);
    await queryRunner.query(`DROP INDEX "IDX_ef998451a458221d3c409b3792"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId" FROM "agents"`,
    );
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_agents" RENAME TO "agents"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
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
    await queryRunner.query(`DROP INDEX "IDX_6cb68059ab1223de4f03f9a726"`);
    await queryRunner.query(`DROP INDEX "IDX_a27865a7be17886e3088f4a650"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_projects" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('planning','active','on_hold','completed','archived') ) NOT NULL DEFAULT ('planning'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "ownerAgentId" varchar, CONSTRAINT "FK_6cb68059ab1223de4f03f9a7268" FOREIGN KEY ("ownerAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_projects"("id", "title", "description", "status", "createdAt", "updatedAt", "ownerAgentId") SELECT "id", "title", "description", "status", "createdAt", "updatedAt", "ownerAgentId" FROM "projects"`,
    );
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_projects" RENAME TO "projects"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cb68059ab1223de4f03f9a726" ON "projects" ("ownerAgentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_70a6d3ec52a15e0ff43d4ad353"`);
    await queryRunner.query(`DROP INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0"`);
    await queryRunner.query(`DROP INDEX "IDX_0a2203f600be90963a165d1432"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_task_comments" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "authorType" varchar CHECK( "authorType" IN ('user','agent') ) NOT NULL, "artifacts" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "taskId" varchar NOT NULL, "authorUserId" varchar, "authorAgentId" varchar, CONSTRAINT "FK_ba265816ca1d93f51083e06c520" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_70a6d3ec52a15e0ff43d4ad3532" FOREIGN KEY ("authorUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_c2d5d4e5e1e33278318fa6b2b05" FOREIGN KEY ("authorAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task_comments"("id", "content", "authorType", "artifacts", "createdAt", "updatedAt", "taskId", "authorUserId", "authorAgentId") SELECT "id", "content", "authorType", "artifacts", "createdAt", "updatedAt", "taskId", "authorUserId", "authorAgentId" FROM "task_comments"`,
    );
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_task_comments" RENAME TO "task_comments"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70a6d3ec52a15e0ff43d4ad353" ON "task_comments" ("authorUserId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0" ON "task_comments" ("authorAgentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a2203f600be90963a165d1432" ON "task_comments" ("taskId", "createdAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "tasks"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`ALTER TABLE "temporary_tasks" RENAME TO "tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_f5bb7be33ddb87ac0f04807b4a"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_recurrent_task_execs" ("id" varchar PRIMARY KEY NOT NULL, "status" varchar CHECK( "status" IN ('running','success','failure','canceled') ) NOT NULL DEFAULT ('running'), "result" text, "latencyMs" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "recurrentTaskId" varchar NOT NULL, CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_recurrent_task_execs"("id", "status", "result", "latencyMs", "createdAt", "updatedAt", "recurrentTaskId") SELECT "id", "status", "result", "latencyMs", "createdAt", "updatedAt", "recurrentTaskId" FROM "recurrent_task_execs"`,
    );
    await queryRunner.query(`DROP TABLE "recurrent_task_execs"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_recurrent_task_execs" RENAME TO "recurrent_task_execs"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId") `,
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
    await queryRunner.query(`DROP INDEX "IDX_070d648bde98d061fd6e9d176d"`);
    await queryRunner.query(`DROP INDEX "IDX_ec511b89bba27b211e32a2a12f"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_refresh_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" text NOT NULL, "issuedAt" datetime NOT NULL DEFAULT (datetime('now')), "expiresAt" datetime NOT NULL, "absoluteExpiry" datetime NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "revokedAt" datetime, CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_refresh_tokens"("id", "userId", "token", "issuedAt", "expiresAt", "absoluteExpiry", "createdAt", "revokedAt") SELECT "id", "userId", "token", "issuedAt", "expiresAt", "absoluteExpiry", "createdAt", "revokedAt" FROM "refresh_tokens"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_refresh_tokens" RENAME TO "refresh_tokens"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_070d648bde98d061fd6e9d176d" ON "refresh_tokens" ("userId", "revokedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec511b89bba27b211e32a2a12f" ON "refresh_tokens" ("userId", "expiresAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ec511b89bba27b211e32a2a12f"`);
    await queryRunner.query(`DROP INDEX "IDX_070d648bde98d061fd6e9d176d"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME TO "temporary_refresh_tokens"`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" text NOT NULL, "issuedAt" datetime NOT NULL DEFAULT (datetime('now')), "expiresAt" datetime NOT NULL, "absoluteExpiry" datetime NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "revokedAt" datetime)`,
    );
    await queryRunner.query(
      `INSERT INTO "refresh_tokens"("id", "userId", "token", "issuedAt", "expiresAt", "absoluteExpiry", "createdAt", "revokedAt") SELECT "id", "userId", "token", "issuedAt", "expiresAt", "absoluteExpiry", "createdAt", "revokedAt" FROM "temporary_refresh_tokens"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_refresh_tokens"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ec511b89bba27b211e32a2a12f" ON "refresh_tokens" ("userId", "expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_070d648bde98d061fd6e9d176d" ON "refresh_tokens" ("userId", "revokedAt") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`);
    await queryRunner.query(`DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`);
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" RENAME TO "temporary_recurrent_tasks"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar)`,
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
    await queryRunner.query(`DROP INDEX "IDX_f5bb7be33ddb87ac0f04807b4a"`);
    await queryRunner.query(
      `ALTER TABLE "recurrent_task_execs" RENAME TO "temporary_recurrent_task_execs"`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurrent_task_execs" ("id" varchar PRIMARY KEY NOT NULL, "status" varchar CHECK( "status" IN ('running','success','failure','canceled') ) NOT NULL DEFAULT ('running'), "result" text, "latencyMs" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "recurrentTaskId" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "recurrent_task_execs"("id", "status", "result", "latencyMs", "createdAt", "updatedAt", "recurrentTaskId") SELECT "id", "status", "result", "latencyMs", "createdAt", "updatedAt", "recurrentTaskId" FROM "temporary_recurrent_task_execs"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_recurrent_task_execs"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(`ALTER TABLE "tasks" RENAME TO "temporary_tasks"`);
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "tasks"("id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId") SELECT "id", "title", "description", "status", "priority", "cost_estimate", "llm_latency", "createdAt", "updatedAt", "assigneeId", "projectId" FROM "temporary_tasks"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_tasks"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4105de371d2c7ca094a830e5cd" ON "tasks" ("projectId", "status", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a097552fe4fba313996835706" ON "tasks" ("projectId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a16d2c86252529f622fa53f1e" ON "tasks" ("assigneeId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_0a2203f600be90963a165d1432"`);
    await queryRunner.query(`DROP INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0"`);
    await queryRunner.query(`DROP INDEX "IDX_70a6d3ec52a15e0ff43d4ad353"`);
    await queryRunner.query(
      `ALTER TABLE "task_comments" RENAME TO "temporary_task_comments"`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_comments" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "authorType" varchar CHECK( "authorType" IN ('user','agent') ) NOT NULL, "artifacts" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "taskId" varchar NOT NULL, "authorUserId" varchar, "authorAgentId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "task_comments"("id", "content", "authorType", "artifacts", "createdAt", "updatedAt", "taskId", "authorUserId", "authorAgentId") SELECT "id", "content", "authorType", "artifacts", "createdAt", "updatedAt", "taskId", "authorUserId", "authorAgentId" FROM "temporary_task_comments"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_task_comments"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_0a2203f600be90963a165d1432" ON "task_comments" ("taskId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0" ON "task_comments" ("authorAgentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70a6d3ec52a15e0ff43d4ad353" ON "task_comments" ("authorUserId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_a27865a7be17886e3088f4a650"`);
    await queryRunner.query(`DROP INDEX "IDX_6cb68059ab1223de4f03f9a726"`);
    await queryRunner.query(
      `ALTER TABLE "projects" RENAME TO "temporary_projects"`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('planning','active','on_hold','completed','archived') ) NOT NULL DEFAULT ('planning'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "ownerAgentId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "projects"("id", "title", "description", "status", "createdAt", "updatedAt", "ownerAgentId") SELECT "id", "title", "description", "status", "createdAt", "updatedAt", "ownerAgentId" FROM "temporary_projects"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_projects"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cb68059ab1223de4f03f9a726" ON "projects" ("ownerAgentId") `,
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
    await queryRunner.query(`DROP INDEX "IDX_ef998451a458221d3c409b3792"`);
    await queryRunner.query(`DROP INDEX "IDX_e927e225423f493fb58dc146cf"`);
    await queryRunner.query(
      `ALTER TABLE "agents" RENAME TO "temporary_agents"`,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"))`,
    );
    await queryRunner.query(
      `INSERT INTO "agents"("id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId") SELECT "id", "name", "description", "systemInstructions", "role", "status", "createdAt", "updatedAt", "providerId", "modelId" FROM "temporary_agents"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_agents"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_2ce64b8d909a4385f26bcd363b"`);
    await queryRunner.query(
      `ALTER TABLE "models" RENAME TO "temporary_models"`,
    );
    await queryRunner.query(
      `CREATE TABLE "models" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar)`,
    );
    await queryRunner.query(
      `INSERT INTO "models"("id", "name", "createdAt", "updatedAt", "providerId") SELECT "id", "name", "createdAt", "updatedAt", "providerId" FROM "temporary_models"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_models"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce64b8d909a4385f26bcd363b" ON "models" ("providerId") `,
    );
    await queryRunner.query(`DROP INDEX "IDX_ec511b89bba27b211e32a2a12f"`);
    await queryRunner.query(`DROP INDEX "IDX_070d648bde98d061fd6e9d176d"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "artifacts"`);
    await queryRunner.query(`DROP INDEX "IDX_a03520bcf60ada1a46bf548e22"`);
    await queryRunner.query(`DROP INDEX "IDX_0f9f543bd40419122e69aeff00"`);
    await queryRunner.query(`DROP TABLE "recurrent_tasks"`);
    await queryRunner.query(`DROP INDEX "IDX_f5bb7be33ddb87ac0f04807b4a"`);
    await queryRunner.query(`DROP TABLE "recurrent_task_execs"`);
    await queryRunner.query(`DROP INDEX "IDX_4105de371d2c7ca094a830e5cd"`);
    await queryRunner.query(`DROP INDEX "IDX_7a097552fe4fba313996835706"`);
    await queryRunner.query(`DROP INDEX "IDX_9a16d2c86252529f622fa53f1e"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP INDEX "IDX_0a2203f600be90963a165d1432"`);
    await queryRunner.query(`DROP INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0"`);
    await queryRunner.query(`DROP INDEX "IDX_70a6d3ec52a15e0ff43d4ad353"`);
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(`DROP INDEX "IDX_a27865a7be17886e3088f4a650"`);
    await queryRunner.query(`DROP INDEX "IDX_6cb68059ab1223de4f03f9a726"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP INDEX "IDX_08d1346ff91abba68e5a637cfd"`);
    await queryRunner.query(`DROP INDEX "IDX_d19892d8f03928e5bfc7313780"`);
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP INDEX "IDX_ef998451a458221d3c409b3792"`);
    await queryRunner.query(`DROP INDEX "IDX_e927e225423f493fb58dc146cf"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP INDEX "IDX_2ce64b8d909a4385f26bcd363b"`);
    await queryRunner.query(`DROP TABLE "models"`);
    await queryRunner.query(`DROP TABLE "providers"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
