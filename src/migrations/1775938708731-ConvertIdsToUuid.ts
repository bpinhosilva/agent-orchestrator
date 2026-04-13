import { MigrationInterface, QueryRunner } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';

export class ConvertIdsToUuid1775938708731 implements MigrationInterface {
  name = 'ConvertIdsToUuid1775938708731';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);
    if (isSqlite) {
      return;
    }

    // 1. Drop Foreign Keys
    await queryRunner.query(
      `ALTER TABLE "models" DROP CONSTRAINT "FK_2ce64b8d909a4385f26bcd363b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" DROP CONSTRAINT "FK_e927e225423f493fb58dc146cf0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" DROP CONSTRAINT "FK_ef998451a458221d3c409b37923"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_6cb68059ab1223de4f03f9a7268"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_d19892d8f03928e5bfc7313780c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" DROP CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_ba265816ca1d93f51083e06c520"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_70a6d3ec52a15e0ff43d4ad3532"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_c2d5d4e5e1e33278318fa6b2b05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" DROP CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" DROP CONSTRAINT "FK_0f9f543bd40419122e69aeff006"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_task_execs" DROP CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );

    // 2. Alter Column Types and Defaults
    const tables = [
      { name: 'users', ids: ['id'] },
      { name: 'providers', ids: ['id'] },
      { name: 'models', ids: ['id', 'providerId'] },
      { name: 'agents', ids: ['id', 'providerId', 'modelId'] },
      { name: 'projects', ids: ['id', 'ownerAgentId'] },
      { name: 'project_members', ids: ['id', 'projectId', 'userId'] },
      { name: 'tasks', ids: ['id', 'assigneeId', 'projectId'] },
      {
        name: 'task_comments',
        ids: ['id', 'taskId', 'authorUserId', 'authorAgentId'],
      },
      { name: 'recurrent_tasks', ids: ['id', 'assigneeId', 'projectId'] },
      { name: 'recurrent_task_execs', ids: ['id', 'recurrentTaskId'] },
      { name: 'artifacts', ids: ['id'] },
      { name: 'refresh_tokens', ids: ['id', 'userId'] },
      { name: 'system_settings', ids: ['id'] },
    ];

    for (const table of tables) {
      for (const col of table.ids) {
        await queryRunner.query(
          `ALTER TABLE "${table.name}" ALTER COLUMN "${col}" TYPE uuid USING "${col}"::uuid`,
        );
        // Remove old string default if exists
        if (col === 'id') {
          await queryRunner.query(
            `ALTER TABLE "${table.name}" ALTER COLUMN "${col}" SET DEFAULT gen_random_uuid()`,
          );
        }
      }
    }

    // 3. Re-create Foreign Keys
    await queryRunner.query(
      `ALTER TABLE "models" ADD CONSTRAINT "FK_2ce64b8d909a4385f26bcd363b3" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ADD CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ADD CONSTRAINT "FK_ef998451a458221d3c409b37923" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_6cb68059ab1223de4f03f9a7268" FOREIGN KEY ("ownerAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_d19892d8f03928e5bfc7313780c" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ADD CONSTRAINT "FK_08d1346ff91abba68e5a637cfdb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_e08fca67ca8966e6b9914bf2956" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_ba265816ca1d93f51083e06c520" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_70a6d3ec52a15e0ff43d4ad3532" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_c2d5d4e5e1e33278318fa6b2b05" FOREIGN KEY ("authorAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" ADD CONSTRAINT "FK_9ec101b70a5f9612b0757d87c83" FOREIGN KEY ("assigneeId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" ADD CONSTRAINT "FK_0f9f543bd40419122e69aeff006" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_task_execs" ADD CONSTRAINT "FK_f5bb7be33ddb87ac0f04807b4ab" FOREIGN KEY ("recurrentTaskId") REFERENCES "recurrent_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);
    if (isSqlite) {
      return Promise.resolve();
    }

    // Downgrade is complex and usually not needed for type changes like this,
    // but we can cast back to text if needed.
    // Omitted for brevity unless strictly required, as it involves the same FK dance.
    return Promise.resolve();
  }
}
