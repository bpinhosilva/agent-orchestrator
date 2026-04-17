import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropArtifactsTable1775940000000 implements MigrationInterface {
  name = 'DropArtifactsTable1775940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "artifacts"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "artifacts" ("id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(), "originalName" varchar NOT NULL, "mimeType" varchar NOT NULL, "filePath" varchar NOT NULL, "metadata" text)`,
    );
  }
}
