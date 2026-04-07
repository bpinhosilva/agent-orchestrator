import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetPostgresIdDefaults1775495000000 implements MigrationInterface {
  name = 'SetPostgresIdDefaults1775495000000';

  private isPostgres(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'postgres';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_task_execs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "artifacts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!this.isPostgres(queryRunner)) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "providers" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "models" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "agents" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_members" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_tasks" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurrent_task_execs" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "artifacts" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "system_settings" ALTER COLUMN "id" DROP DEFAULT`,
    );
  }
}
