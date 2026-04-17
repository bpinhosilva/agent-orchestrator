import { MigrationInterface, QueryRunner } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';

export class MigrateSimpleJsonToJsonb1775935855172 implements MigrationInterface {
  name = 'MigrateSimpleJsonToJsonb1775935855172';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);
    if (!isSqlite) {
      await queryRunner.query(
        `ALTER TABLE "task_comments" ALTER COLUMN "artifacts" TYPE jsonb USING "artifacts"::jsonb`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_task_execs" ALTER COLUMN "artifacts" TYPE jsonb USING "artifacts"::jsonb`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);
    if (!isSqlite) {
      await queryRunner.query(
        `ALTER TABLE "task_comments" ALTER COLUMN "artifacts" TYPE text USING "artifacts"::text`,
      );
      await queryRunner.query(
        `ALTER TABLE "recurrent_task_execs" ALTER COLUMN "artifacts" TYPE text USING "artifacts"::text`,
      );
    }
  }
}
