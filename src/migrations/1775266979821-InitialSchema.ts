import { MigrationInterface, QueryRunner } from 'typeorm';
import { normalizeMigrationSqlForDriver } from '../database/migration-sql.utils';

export class InitialSchema1775266979821 implements MigrationInterface {
  name = 'InitialSchema1775266979821';

  private async execute(queryRunner: QueryRunner, sql: string): Promise<void> {
    await queryRunner.query(
      normalizeMigrationSqlForDriver(queryRunner.connection.options.type, sql),
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.execute(
      queryRunner,
      `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "last_name" varchar NOT NULL, "email" varchar NOT NULL, "password" varchar, "role" varchar NOT NULL DEFAULT ('user'), "avatar" varchar NOT NULL DEFAULT ('avatar-01'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "providers" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_d735474e539e674ba3702eddc44" UNIQUE ("name"))`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "models" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, CONSTRAINT "FK_2ce64b8d909a4385f26bcd363b3" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_2ce64b8d909a4385f26bcd363b" ON "models" ("providerId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "agents" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" text, "systemInstructions" text, "role" text, "status" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "providerId" varchar, "modelId" varchar, CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"), CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
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
      `CREATE TABLE "projects" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('planning','active','on_hold','completed','archived') ) NOT NULL DEFAULT ('planning'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "ownerAgentId" varchar, CONSTRAINT "FK_6cb68059ab1223de4f03f9a7268" FOREIGN KEY ("ownerAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_6cb68059ab1223de4f03f9a726" ON "projects" ("ownerAgentId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_a27865a7be17886e3088f4a650" ON "projects" ("status") `,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "project_members" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "projectId" varchar, "userId" varchar, CONSTRAINT "UQ_326b2a901eb18ac24eabc9b0581" UNIQUE ("projectId", "userId"), CONSTRAINT "FK_d19892d8f03928e5bfc7313780c" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_d19892d8f03928e5bfc7313780" ON "project_members" ("projectId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_08d1346ff91abba68e5a637cfd" ON "project_members" ("userId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('backlog','in-progress','review','done','archived') ) NOT NULL DEFAULT ('backlog'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cost_estimate" float NOT NULL DEFAULT (0), "llm_latency" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar, "projectId" varchar NOT NULL, CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
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
      `CREATE TABLE "task_comments" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "authorType" varchar CHECK( "authorType" IN ('user','agent') ) NOT NULL, "artifacts" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "taskId" varchar NOT NULL, "authorUserId" varchar, "authorAgentId" varchar, CONSTRAINT "FK_ba265816ca1d93f51083e06c520" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_70a6d3ec52a15e0ff43d4ad3532" FOREIGN KEY ("authorUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION, CONSTRAINT "FK_c2d5d4e5e1e33278318fa6b2b05" FOREIGN KEY ("authorAgentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_70a6d3ec52a15e0ff43d4ad353" ON "task_comments" ("authorUserId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_c2d5d4e5e1e33278318fa6b2b0" ON "task_comments" ("authorAgentId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_0a2203f600be90963a165d1432" ON "task_comments" ("taskId", "createdAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "recurrent_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "status" varchar CHECK( "status" IN ('active','paused','error') ) NOT NULL DEFAULT ('active'), "priority" varchar CHECK( "priority" IN ('0','1','2','3') ) NOT NULL DEFAULT (2), "cronExpression" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "assigneeId" varchar NOT NULL, "projectId" varchar, CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
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
      `CREATE TABLE "recurrent_task_execs" ("id" varchar PRIMARY KEY NOT NULL, "status" varchar CHECK( "status" IN ('running','success','failure','canceled') ) NOT NULL DEFAULT ('running'), "result" text, "latencyMs" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "recurrentTaskId" varchar NOT NULL, CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_f5bb7be33ddb87ac0f04807b4a" ON "recurrent_task_execs" ("recurrentTaskId") `,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "artifacts" ("id" varchar PRIMARY KEY NOT NULL, "originalName" varchar NOT NULL, "mimeType" varchar NOT NULL, "filePath" varchar NOT NULL, "metadata" text)`,
    );
    await this.execute(
      queryRunner,
      `CREATE TABLE "refresh_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" text NOT NULL, "issuedAt" datetime NOT NULL DEFAULT (datetime('now')), "expiresAt" datetime NOT NULL, "absoluteExpiry" datetime NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "revokedAt" datetime, CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_070d648bde98d061fd6e9d176d" ON "refresh_tokens" ("userId", "revokedAt") `,
    );
    await this.execute(
      queryRunner,
      `CREATE INDEX "IDX_ec511b89bba27b211e32a2a12f" ON "refresh_tokens" ("userId", "expiresAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.execute(queryRunner, `DROP TABLE "refresh_tokens"`);
    await this.execute(queryRunner, `DROP TABLE "artifacts"`);
    await this.execute(queryRunner, `DROP TABLE "recurrent_task_execs"`);
    await this.execute(queryRunner, `DROP TABLE "recurrent_tasks"`);
    await this.execute(queryRunner, `DROP TABLE "task_comments"`);
    await this.execute(queryRunner, `DROP TABLE "tasks"`);
    await this.execute(queryRunner, `DROP TABLE "project_members"`);
    await this.execute(queryRunner, `DROP TABLE "projects"`);
    await this.execute(queryRunner, `DROP TABLE "agents"`);
    await this.execute(queryRunner, `DROP TABLE "models"`);
    await this.execute(queryRunner, `DROP TABLE "providers"`);
    await this.execute(queryRunner, `DROP TABLE "users"`);
  }
}
