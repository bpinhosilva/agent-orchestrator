import { DataSource } from 'typeorm';
import { InitialSchema1775266979821 } from '../1775266979821-InitialSchema';
import { SeedDefaultProvidersAndModels1775268200000 } from '../1775268200000-SeedDefaultProvidersAndModels';

describe('SeedDefaultProvidersAndModels migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      migrations: [
        InitialSchema1775266979821,
        SeedDefaultProvidersAndModels1775268200000,
      ],
    });

    await dataSource.initialize();
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('seeds default providers with their default models', async () => {
    await dataSource.runMigrations();

    await expect(
      dataSource.query('SELECT id, name FROM providers ORDER BY name ASC'),
    ).resolves.toEqual([
      expect.objectContaining({ name: 'anthropic' }),
      expect.objectContaining({ name: 'google' }),
    ]);
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
