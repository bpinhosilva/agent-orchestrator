import { DataSource } from 'typeorm';
import { InitialSchema1775266979821 } from '../1775266979821-InitialSchema';
import { BackfillDefaultModelProviderIds1775269500000 } from '../1775269500000-BackfillDefaultModelProviderIds';

describe('BackfillDefaultModelProviderIds migration', () => {
  let dataSource: DataSource;
  let migration: BackfillDefaultModelProviderIds1775269500000;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      migrations: [InitialSchema1775266979821],
    });

    await dataSource.initialize();
    await dataSource.runMigrations();
    migration = new BackfillDefaultModelProviderIds1775269500000();

    await dataSource.query(
      `INSERT INTO "providers" ("id", "name") VALUES
        ('google-provider', 'google'),
        ('anthropic-provider', 'anthropic')`,
    );

    await dataSource.query(
      `INSERT INTO "models" ("id", "name", "providerId") VALUES
        ('m1', 'gemini-2.5-flash-lite', NULL),
        ('m2', 'gemini-2.5-flash-image', NULL),
        ('m3', 'claude-opus-4-6', NULL),
        ('m4', 'claude-sonnet-4-6', NULL),
        ('m5', 'claude-haiku-4-5', NULL)`,
    );
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('backfills providerId for default models with null providerId', async () => {
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);
    await queryRunner.release();

    await expect(
      dataSource.query(
        `SELECT models.name AS name, providers.name AS providerName
         FROM models
         INNER JOIN providers ON providers.id = models.providerId
         ORDER BY providers.name ASC, models.name ASC`,
      ),
    ).resolves.toEqual([
      { name: 'claude-haiku-4-5', providerName: 'anthropic' },
      { name: 'claude-opus-4-6', providerName: 'anthropic' },
      { name: 'claude-sonnet-4-6', providerName: 'anthropic' },
      { name: 'gemini-2.5-flash-image', providerName: 'google' },
      { name: 'gemini-2.5-flash-lite', providerName: 'google' },
    ]);
  });
});
