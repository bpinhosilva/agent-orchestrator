import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

type IdRow = { id: string };

export class AddOllamaProviderAndModel1775270000000 implements MigrationInterface {
  name = 'AddOllamaProviderAndModel1775270000000';

  private escapeSqlLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  private async getIdRow(
    queryRunner: QueryRunner,
    sql: string,
  ): Promise<IdRow | null> {
    const rows = (await queryRunner.query(sql)) as IdRow[];
    return rows[0] ?? null;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existingProvider = await this.getIdRow(
      queryRunner,
      `SELECT "id" FROM "providers" WHERE "name" = 'ollama'`,
    );

    const providerId = existingProvider?.id ?? randomUUID();

    if (!existingProvider) {
      await queryRunner.query(
        `INSERT INTO "providers" ("id", "name") VALUES (${this.escapeSqlLiteral(providerId)}, 'ollama')`,
      );
    }

    const existingModel = await this.getIdRow(
      queryRunner,
      `SELECT "id" FROM "models" WHERE "name" = 'gemma4' AND "providerId" = ${this.escapeSqlLiteral(providerId)}`,
    );

    if (!existingModel) {
      await queryRunner.query(
        `INSERT INTO "models" ("id", "name", "providerId") VALUES (${this.escapeSqlLiteral(randomUUID())}, 'gemma4', ${this.escapeSqlLiteral(providerId)})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const provider = await this.getIdRow(
      queryRunner,
      `SELECT "id" FROM "providers" WHERE "name" = 'ollama'`,
    );

    if (provider) {
      await queryRunner.query(
        `DELETE FROM "models" WHERE "name" = 'gemma4' AND "providerId" = ${this.escapeSqlLiteral(provider.id)}`,
      );
    }

    await queryRunner.query(`DELETE FROM "providers" WHERE "name" = 'ollama'`);
  }
}
