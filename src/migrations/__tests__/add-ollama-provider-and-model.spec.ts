import { DataSource } from 'typeorm';
import { InitialSchema1775266979821 } from '../1775266979821-InitialSchema';
import { AddOllamaProviderAndModel1775270000000 } from '../1775270000000-AddOllamaProviderAndModel';

describe('AddOllamaProviderAndModel migration', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      migrations: [
        InitialSchema1775266979821,
        AddOllamaProviderAndModel1775270000000,
      ],
    });

    await dataSource.initialize();
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('seeds ollama provider and gemma4 model', async () => {
    await dataSource.runMigrations();

    await expect(
      dataSource.query(`SELECT name FROM providers WHERE name = 'ollama'`),
    ).resolves.toEqual([{ name: 'ollama' }]);

    await expect(
      dataSource.query(
        `SELECT models.name AS name, providers.name AS providerName
         FROM models
         INNER JOIN providers ON providers.id = models.providerId
         WHERE providers.name = 'ollama'`,
      ),
    ).resolves.toEqual([{ name: 'gemma4', providerName: 'ollama' }]);
  });

  it('is idempotent: running up twice does not duplicate records', async () => {
    await dataSource.runMigrations();

    const migration = new AddOllamaProviderAndModel1775270000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.up(queryRunner);
    await queryRunner.release();

    await expect(
      dataSource.query(`SELECT name FROM providers WHERE name = 'ollama'`),
    ).resolves.toHaveLength(1);

    await expect(
      dataSource.query(
        `SELECT models.name FROM models
         INNER JOIN providers ON providers.id = models.providerId
         WHERE providers.name = 'ollama'`,
      ),
    ).resolves.toHaveLength(1);
  });

  it('removes ollama provider and gemma4 model on down', async () => {
    await dataSource.runMigrations();

    const migration = new AddOllamaProviderAndModel1775270000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.down(queryRunner);
    await queryRunner.release();

    await expect(
      dataSource.query(`SELECT name FROM providers WHERE name = 'ollama'`),
    ).resolves.toEqual([]);

    await expect(
      dataSource.query(`SELECT name FROM models WHERE name = 'gemma4'`),
    ).resolves.toEqual([]);
  });

  it('does not fail down when provider does not exist', async () => {
    // Run InitialSchema so tables exist, but do not run the ollama migration
    await dataSource.runMigrations();
    // Now rollback (ollama was inserted by up, so roll it back)
    const migration = new AddOllamaProviderAndModel1775270000000();
    const queryRunner = dataSource.createQueryRunner();
    await migration.down(queryRunner);
    await queryRunner.release();

    // Running down again when the provider is already gone should not throw
    const queryRunner2 = dataSource.createQueryRunner();
    await expect(migration.down(queryRunner2)).resolves.not.toThrow();
    await queryRunner2.release();
  });
});
