/* eslint-disable */
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class InitialSchemaAndSeed1774746981348 implements MigrationInterface {
  name = 'InitialSchemaAndSeed1774746981348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestampType = isPostgres ? 'timestamp' : 'datetime';
    const defaultTimestamp = isPostgres ? 'CURRENT_TIMESTAMP' : "(datetime('now'))";

    // Create Tables
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'email', type: 'varchar', isUnique: true },
          { name: 'password', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'artifacts',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'originalName', type: 'varchar' },
          { name: 'mimeType', type: 'varchar' },
          { name: 'filePath', type: 'varchar' },
          { name: 'metadata', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'providers',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'models',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'providerId', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['providerId'],
            referencedTableName: 'providers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          { columnNames: ['providerId'], name: 'IDX_2ce64b8d909a4385f26bcd363b' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'agents',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'systemInstructions', type: 'text', isNullable: true },
          { name: 'role', type: 'text', isNullable: true },
          { name: 'status', type: 'text', isNullable: true },
          { name: 'providerId', type: 'varchar', isNullable: true },
          { name: 'modelId', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['providerId'],
            referencedTableName: 'providers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['modelId'],
            referencedTableName: 'models',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          { columnNames: ['providerId'], name: 'IDX_e927e225423f493fb58dc146cf' },
          { columnNames: ['modelId'], name: 'IDX_ef998451a458221d3c409b3792' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'status', type: 'varchar', default: "'planning'" },
          { name: 'ownerAgentId', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['ownerAgentId'],
            referencedTableName: 'agents',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          { columnNames: ['ownerAgentId'], name: 'IDX_6cb68059ab1223de4f03f9a726' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'status', type: 'varchar', default: "'backlog'" },
          { name: 'priority', type: 'varchar', default: "'2'" },
          { name: 'cost_estimate', type: 'float', default: 0 },
          { name: 'llm_latency', type: 'integer', default: 0 },
          { name: 'assigneeId', type: 'varchar', isNullable: true },
          { name: 'projectId', type: 'varchar' },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['assigneeId'],
            referencedTableName: 'agents',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['projectId'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          { columnNames: ['assigneeId'], name: 'IDX_9a16d2c86252529f622fa53f1e' },
          { columnNames: ['projectId', 'updatedAt'], name: 'IDX_7a097552fe4fba313996835706' },
          { columnNames: ['projectId', 'status', 'updatedAt'], name: 'IDX_4105de371d2c7ca094a830e5cd' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_comments',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'content', type: 'text' },
          { name: 'authorType', type: 'varchar' },
          { name: 'artifacts', type: 'text', isNullable: true },
          { name: 'taskId', type: 'varchar' },
          { name: 'authorUserId', type: 'varchar', isNullable: true },
          { name: 'authorAgentId', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['taskId'],
            referencedTableName: 'tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['authorUserId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
          {
            columnNames: ['authorAgentId'],
            referencedTableName: 'agents',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          { columnNames: ['authorUserId'], name: 'IDX_70a6d3ec52a15e0ff43d4ad353' },
          { columnNames: ['authorAgentId'], name: 'IDX_c2d5d4e5e1e33278318fa6b2b0' },
          { columnNames: ['taskId', 'createdAt'], name: 'IDX_0a2203f600be90963a165d1432' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'recurrent_tasks',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'status', type: 'varchar', default: "'active'" },
          { name: 'priority', type: 'varchar', default: "'2'" },
          { name: 'cronExpression', type: 'varchar' },
          { name: 'assigneeId', type: 'varchar' },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['assigneeId'],
            referencedTableName: 'agents',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'recurrent_task_execs',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'status', type: 'varchar', default: "'running'" },
          { name: 'result', type: 'text', isNullable: true },
          { name: 'latencyMs', type: 'integer', isNullable: true },
          { name: 'recurrentTaskId', type: 'varchar' },
          { name: 'createdAt', type: timestampType, default: defaultTimestamp },
          { name: 'updatedAt', type: timestampType, default: defaultTimestamp },
        ],
        foreignKeys: [
          {
            columnNames: ['recurrentTaskId'],
            referencedTableName: 'recurrent_tasks',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
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
    await queryRunner.dropTable('recurrent_task_execs', true);
    await queryRunner.dropTable('recurrent_tasks', true);
    await queryRunner.dropTable('task_comments', true);
    await queryRunner.dropTable('tasks', true);
    await queryRunner.dropTable('projects', true);
    await queryRunner.dropTable('agents', true);
    await queryRunner.dropTable('models', true);
    await queryRunner.dropTable('providers', true);
    await queryRunner.dropTable('artifacts', true);
    await queryRunner.dropTable('users', true);
  }
}

