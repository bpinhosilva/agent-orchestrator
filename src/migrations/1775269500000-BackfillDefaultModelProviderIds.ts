import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_PROVIDER_MODELS } from '../agents/default-provider-models';

type DefaultProviderModelSeed = {
  providerName: string;
  models: readonly string[];
};

export class BackfillDefaultModelProviderIds1775269500000 implements MigrationInterface {
  name = 'BackfillDefaultModelProviderIds1775269500000';

  private escapeSqlLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  private isIdRow(row: unknown): row is { id: string } {
    return (
      typeof row === 'object' &&
      row !== null &&
      'id' in row &&
      typeof (row as { id: unknown }).id === 'string'
    );
  }

  private async getProviderIdsByName(
    queryRunner: QueryRunner,
    providerName: string,
  ): Promise<string[]> {
    const rows: unknown = await queryRunner.query(
      `SELECT "id" FROM "providers" WHERE "name" = ${this.escapeSqlLiteral(providerName)}`,
    );

    if (!Array.isArray(rows)) {
      return [];
    }

    const providerIds: string[] = [];
    for (const row of rows as unknown[]) {
      if (this.isIdRow(row)) {
        providerIds.push(row.id);
      }
    }

    return providerIds;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const seed of DEFAULT_PROVIDER_MODELS as readonly DefaultProviderModelSeed[]) {
      const [providerId] = await this.getProviderIdsByName(
        queryRunner,
        seed.providerName,
      );
      if (!providerId) {
        continue;
      }

      const modelNames = seed.models.map((modelName) =>
        this.escapeSqlLiteral(modelName),
      );

      await queryRunner.query(
        `UPDATE "models"
         SET "providerId" = ${this.escapeSqlLiteral(providerId)}
         WHERE "providerId" IS NULL
           AND "name" IN (${modelNames.join(', ')})`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const modelNames = (
      DEFAULT_PROVIDER_MODELS as readonly DefaultProviderModelSeed[]
    )
      .flatMap((seed) => seed.models)
      .map((modelName) => this.escapeSqlLiteral(modelName));

    await queryRunner.query(
      `UPDATE "models"
       SET "providerId" = NULL
       WHERE "name" IN (${modelNames.join(', ')})`,
    );
  }
}
