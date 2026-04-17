import { MigrationInterface, QueryRunner } from 'typeorm';
import { isSqliteDriver } from '../config/typeorm';

export class RemoveProviderIdFromAgents1775939208983 implements MigrationInterface {
  name = 'RemoveProviderIdFromAgents1775939208983';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);

    if (isSqlite) {
      // SQLite doesn't support DROP COLUMN directly, but we can do the temporary table dance if needed.
      // However, usually we can just leave it or use queryRunner.dropColumn which handles it in newer TypeORM.
      // Let's use the explicit dance for safety if we were being thorough, but for now let's try dropColumn.
      await queryRunner.dropColumn('agents', 'providerId');
    } else {
      await queryRunner.query(
        `ALTER TABLE "agents" DROP CONSTRAINT "FK_e927e225423f493fb58dc146cf0"`,
      );
      await queryRunner.query(`DROP INDEX "IDX_e927e225423f493fb58dc146cf"`);
      await queryRunner.query(`ALTER TABLE "agents" DROP COLUMN "providerId"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isSqlite = isSqliteDriver(queryRunner.connection.options.type);

    if (isSqlite) {
      await queryRunner.query(
        `ALTER TABLE "agents" ADD COLUMN "providerId" varchar`,
      );
    } else {
      await queryRunner.query(
        `ALTER TABLE "agents" ADD COLUMN "providerId" uuid`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_e927e225423f493fb58dc146cf" ON "agents" ("providerId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "agents" ADD CONSTRAINT "FK_e927e225423f493fb58dc146cf0" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
    }
  }
}
