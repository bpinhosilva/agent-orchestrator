import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';

export class AddAgentAttributes1775290000000 implements MigrationInterface {
  name = 'AddAgentAttributes1775290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);

    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'attributes',
        type: isSqlite ? 'text' : 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('agents', 'attributes');
  }
}
