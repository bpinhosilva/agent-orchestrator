import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSnakeCaseColumnsToCamelCase1775936433494 implements MigrationInterface {
  name = 'RenameSnakeCaseColumnsToCamelCase1775936433494';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "last_name" TO "lastName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "cost_estimate" TO "costEstimate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "llm_latency" TO "llmLatency"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "costEstimate" TO "cost_estimate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" RENAME COLUMN "llmLatency" TO "llm_latency"`,
    );
  }
}
