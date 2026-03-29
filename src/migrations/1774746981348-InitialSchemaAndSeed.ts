/* eslint-disable */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class InitialSchemaAndSeed1774746981348 implements MigrationInterface {
  name = 'InitialSchemaAndSeed1774746981348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Tables
    await queryRunner.query(
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "artifacts" ("id" varchar PRIMARY KEY NOT NULL, "originalName" varchar NOT NULL, "mimeType" varchar NOT NULL, "filePath" varchar NOT NULL, "metadata" text)`,
    );
    await queryRunner.query(
      `CREATE TABLE "providers" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d735474e539e674ba3702eddc44" UNIQUE ("name"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "models" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, CONSTRAINT "FK_2ce64b8d909a4385f26bcd363b3" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ce64b8d909a4385f26bcd363b" ON "models" ("providerId") `,
    );

    await queryRunner.query(
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef998451a458221d3c409b3792" ON "agents" ("modelId") `,
    );

    await queryRunner.query(
      `CREATE TABLE "projects" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('planning','active','on_hold','completed','archived') ) NOT NULL DEFAULT ('planning'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "ownerAgentId" varchar, CONSTRAINT "FK_6cb68059ab1223de4f03f9a7268" FOREIGN KEY ("ownerAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cb68059ab1223de4f03f9a726" ON "projects" ("ownerAgentId") `,
    );

    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
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
      `CREATE TABLE "task_comments" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "authorType" varchar CHECK( "authorType" IN ('user','agent') ) NOT NULL, "artifacts" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "taskId" varchar NOT NULL, "authorUserId" varchar, "authorAgentId" varchar, CONSTRAINT "FK_ba265816ca1d93f51083e06c520" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_70a6d3ec52a15e0ff43d4ad3532" FOREIGN KEY ("authorUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_c2d5d4e5e1e33278318fa6b2b05" FOREIGN KEY ("authorAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
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
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );

    await queryRunner.query(
      `CREATE TABLE "recurrent_task_execs" ("id" varchar PRIMARY KEY NOT NULL, "status" varchar CHECK( "status" IN ('running','success','failure','canceled') ) NOT NULL DEFAULT ('running'), "result" text, "latencyMs" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "recurrentTaskId" varchar NOT NULL, CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );

    // Seed Data
    const googleProviderId = uuidv4();
    const anthropicProviderId = uuidv4();
    const now = new Date().toISOString();

    await queryRunner.query(
      `INSERT INTO "providers" (id, name, description, "createdAt", "updatedAt") VALUES ('${googleProviderId}', 'google', 'Google AI provider', '${now}', '${now}')`,
    );
    await queryRunner.query(
      `INSERT INTO "providers" (id, name, description, "createdAt", "updatedAt") VALUES ('${anthropicProviderId}', 'anthropic', 'Anthropic AI provider', '${now}', '${now}')`,
    );

    const googleModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-image',
      'gemini-2.5-pro',
    ];
    for (const modelName of googleModels) {
      await queryRunner.query(
        `INSERT INTO "models" (id, name, "providerId", "createdAt", "updatedAt") VALUES ('${uuidv4()}', '${modelName}', '${googleProviderId}', '${now}', '${now}')`,
      );
    }
    await queryRunner.query(
      `INSERT INTO "models" (id, name, "providerId", "createdAt", "updatedAt") VALUES ('${uuidv4()}', 'claude-opus-4-6', '${anthropicProviderId}', '${now}', '${now}')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "recurrent_task_execs"`);
    await queryRunner.query(`DROP TABLE "recurrent_tasks"`);
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP TABLE "models"`);
    await queryRunner.query(`DROP TABLE "providers"`);
    await queryRunner.query(`DROP TABLE "artifacts"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
