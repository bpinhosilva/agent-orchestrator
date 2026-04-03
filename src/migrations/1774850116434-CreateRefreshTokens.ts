import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRefreshTokens1774850116434 implements MigrationInterface {
  name = 'CreateRefreshTokens1774850116434';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';
    const timestampType = isPostgres ? 'timestamp' : 'datetime';
    const defaultTimestamp = isPostgres
      ? 'CURRENT_TIMESTAMP'
      : "(datetime('now'))";

    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'varchar',
          },
          {
            name: 'token',
            type: 'text',
          },
          {
            name: 'issuedAt',
            type: timestampType,
            default: defaultTimestamp,
          },
          {
            name: 'expiresAt',
            type: timestampType,
          },
          {
            name: 'absoluteExpiry',
            type: timestampType,
          },
          {
            name: 'createdAt',
            type: timestampType,
            default: defaultTimestamp,
          },
          {
            name: 'revokedAt',
            type: timestampType,
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        columnNames: ['userId', 'expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens');
  }
}
