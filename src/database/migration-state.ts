import { createDataSource, isSqliteDriver } from '../config/typeorm';

export interface MigrationStatus {
  hasPending: boolean;
  isEmpty: boolean;
}

interface CheckPendingMigrationsOptions {
  assumePendingOnError?: boolean;
}

async function getMigrationContext(
  dataSource: ReturnType<typeof createDataSource>,
): Promise<{
  hasPending: boolean;
  isEmpty: boolean;
}> {
  const hasPending = await dataSource.showMigrations();

  const tables: Array<{ name?: string; table_name?: string }> =
    await dataSource.query(
      isSqliteDriver(dataSource.options.type)
        ? "SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('migrations', 'sqlite_sequence')"
        : "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name != 'migrations'",
    );

  return {
    hasPending,
    isEmpty: tables.length === 0,
  };
}

export async function checkPendingMigrations(
  options: CheckPendingMigrationsOptions = {},
): Promise<MigrationStatus> {
  const dataSource = createDataSource();

  try {
    await dataSource.initialize();
    const { hasPending, isEmpty } = await getMigrationContext(dataSource);

    await dataSource.destroy();
    return { hasPending, isEmpty };
  } catch (err: unknown) {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    if (options.assumePendingOnError) {
      return {
        hasPending: true,
        isEmpty: true,
      };
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Migration status check failed: ${errorMessage}`);
  }
}

export async function runMigrations(force = false): Promise<void> {
  const dataSource = createDataSource();

  try {
    await dataSource.initialize();

    if (force) {
      console.log('Dropping database schema...');
      await dataSource.dropDatabase();
      console.log('Schema dropped successfully.');
    }

    await getMigrationContext(dataSource);

    console.log('Running database migrations...');
    const result = await dataSource.runMigrations();

    if (result.length > 0) {
      console.log(`Successfully executed ${result.length} migrations.`);
    } else {
      console.log('No pending migrations found.');
    }

    await dataSource.destroy();
  } catch (err: unknown) {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }

    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Migration execution failed: ${errorMessage}`);
  }
}
