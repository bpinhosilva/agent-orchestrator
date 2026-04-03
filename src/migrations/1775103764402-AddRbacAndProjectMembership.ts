import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddRbacAndProjectMembership1775103764402 implements MigrationInterface {
  name = 'AddRbacAndProjectMembership1775103764402';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add 'role' to users
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        default: "'user'",
      }),
    );

    // 2. Add 'projectId' to recurrent_tasks
    await queryRunner.addColumn(
      'recurrent_tasks',
      new TableColumn({
        name: 'projectId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // 3. Create project_members table
    await queryRunner.createTable(
      new Table({
        name: 'project_members',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true },
          { name: 'role', type: 'varchar', default: "'member'" },
          {
            name: 'createdAt',
            type:
              queryRunner.connection.options.type === 'postgres'
                ? 'timestamp'
                : 'datetime',
            default:
              queryRunner.connection.options.type === 'postgres'
                ? 'CURRENT_TIMESTAMP'
                : "(datetime('now'))",
          },
          { name: 'projectId', type: 'varchar', isNullable: true },
          { name: 'userId', type: 'varchar', isNullable: true },
        ],
        uniques: [
          {
            name: 'UQ_326b2a901eb18ac24eabc9b0581',
            columnNames: ['projectId', 'userId'],
          },
        ],
        indices: [
          {
            name: 'IDX_d19892d8f03928e5bfc7313780',
            columnNames: ['projectId'],
          },
          { name: 'IDX_08d1346ff91abba68e5a637cfd', columnNames: ['userId'] },
        ],
        foreignKeys: [
          {
            name: 'FK_d19892d8f03928e5bfc7313780c',
            columnNames: ['projectId'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_08d1346ff91abba68e5a637cfdb',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // 4. Add Foreign Key for recurrent_tasks.projectId
    await queryRunner.createForeignKey(
      'recurrent_tasks',
      new TableForeignKey({
        name: 'FK_0f9f543bd40419122e69aeff006',
        columnNames: ['projectId'],
        referencedTableName: 'projects',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 5. Add Indices
    await queryRunner.createIndices('projects', [
      new TableIndex({
        name: 'IDX_a27865a7be17886e3088f4a650',
        columnNames: ['status'],
      }),
    ]);

    await queryRunner.createIndices('recurrent_task_execs', [
      new TableIndex({
        name: 'IDX_f5bb7be33ddb87ac0f04807b4a',
        columnNames: ['recurrentTaskId'],
      }),
    ]);

    await queryRunner.createIndices('recurrent_tasks', [
      new TableIndex({
        name: 'IDX_0f9f543bd40419122e69aeff00',
        columnNames: ['projectId'],
      }),
      new TableIndex({
        name: 'IDX_a03520bcf60ada1a46bf548e22',
        columnNames: ['status'],
      }),
    ]);

    // Handle refresh_tokens index if the table exists (it was created in a separate migration)
    const hasRefreshTokens = await queryRunner.hasTable('refresh_tokens');
    if (hasRefreshTokens) {
      await queryRunner.createIndex(
        'refresh_tokens',
        new TableIndex({
          name: 'IDX_070d648bde98d061fd6e9d176d',
          columnNames: ['userId', 'revokedAt'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse indices
    await queryRunner.dropIndex(
      'recurrent_tasks',
      'IDX_a03520bcf60ada1a46bf548e22',
    );
    await queryRunner.dropIndex(
      'recurrent_tasks',
      'IDX_0f9f543bd40419122e69aeff00',
    );
    await queryRunner.dropIndex(
      'recurrent_task_execs',
      'IDX_f5bb7be33ddb87ac0f04807b4a',
    );
    await queryRunner.dropIndex('projects', 'IDX_a27865a7be17886e3088f4a650');

    const hasRefreshTokens = await queryRunner.hasTable('refresh_tokens');
    if (hasRefreshTokens) {
      await queryRunner.dropIndex(
        'refresh_tokens',
        'IDX_070d648bde98d061fd6e9d176d',
      );
    }

    // Drop foreign key and column from recurrent_tasks
    const recurrentTasksTable = await queryRunner.getTable('recurrent_tasks');
    const foreignKey = recurrentTasksTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('projectId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('recurrent_tasks', foreignKey);
    }
    await queryRunner.dropColumn('recurrent_tasks', 'projectId');

    // Drop project_members table
    await queryRunner.dropTable('project_members');

    // Drop role column from users
    await queryRunner.dropColumn('users', 'role');
  }
}
