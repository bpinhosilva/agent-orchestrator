import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_PROVIDER_MODELS } from '../agents/default-provider-models';

type IdRow = { id: string };

export class SeedDefaultProvidersAndModels1775268200000 implements MigrationInterface {
  name = 'SeedDefaultProvidersAndModels1775268200000';

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
    for (const seed of DEFAULT_PROVIDER_MODELS) {
      const existingProvider = await this.getIdRow(
        queryRunner,
        `SELECT "id" FROM "providers" WHERE "name" = ${this.escapeSqlLiteral(seed.providerName)}`,
      );

      const providerId = existingProvider?.id ?? randomUUID();

      if (!existingProvider) {
        await queryRunner.query(
          `INSERT INTO "providers" ("id", "name") VALUES (${this.escapeSqlLiteral(providerId)}, ${this.escapeSqlLiteral(seed.providerName)})`,
        );
      }

      for (const modelName of seed.models) {
        const existingModel = await this.getIdRow(
          queryRunner,
          `SELECT "id" FROM "models" WHERE "name" = ${this.escapeSqlLiteral(modelName)} AND "providerId" = ${this.escapeSqlLiteral(providerId)}`,
        );

        if (existingModel) {
          continue;
        }

        await queryRunner.query(
          `INSERT INTO "models" ("id", "name", "providerId") VALUES (${this.escapeSqlLiteral(randomUUID())}, ${this.escapeSqlLiteral(modelName)}, ${this.escapeSqlLiteral(providerId)})`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const providerNames = DEFAULT_PROVIDER_MODELS.map(
      (seed) => seed.providerName,
    ) as string[];
    const modelNames = DEFAULT_PROVIDER_MODELS.flatMap((seed) => seed.models);
    const providerNamesList = providerNames.map((name) =>
      this.escapeSqlLiteral(name),
    );
    const modelNamesList = modelNames.map((name) =>
      this.escapeSqlLiteral(name),
    );

    const providers = (await queryRunner.query(
      `SELECT "id" FROM "providers" WHERE "name" IN (${providerNamesList.join(', ')})`,
    )) as IdRow[];

    const providerIds = providers.map((provider) => provider.id);
    const providerIdsList = providerIds.map((id) => this.escapeSqlLiteral(id));

    if (providerIds.length > 0) {
      await queryRunner.query(
        `DELETE FROM "models" WHERE "providerId" IN (${providerIdsList.join(', ')}) AND "name" IN (${modelNamesList.join(', ')})`,
      );
    }

    await queryRunner.query(
      `DELETE FROM "providers" WHERE "name" IN (${providerNamesList.join(', ')})`,
    );
  }
}
