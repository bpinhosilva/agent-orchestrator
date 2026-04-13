import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { getPackageRoot, getSqlitePath, loadRuntimeEnv } from './runtime-paths';

loadRuntimeEnv();

const dbType = process.env.DB_TYPE;
const databaseUrl = process.env.DATABASE_URL;

export const JSON_COLUMN_TYPE =
  dbType === 'sqlite' || (!dbType && !databaseUrl) ? 'simple-json' : 'jsonb';

export const UUID_COLUMN_TYPE =
  dbType === 'sqlite' || (!dbType && !databaseUrl) ? 'varchar' : 'uuid';

export type RuntimeDbType = 'postgres' | 'sqlite';

export function resolveDataSourceType(
  dbType: RuntimeDbType,
): 'postgres' | 'better-sqlite3' {
  return dbType === 'sqlite' ? 'better-sqlite3' : 'postgres';
}

export function isSqliteDriver(type: DataSourceOptions['type']): boolean {
  return type === 'sqlite' || type === 'better-sqlite3';
}

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const configuredDbType = configService.get<RuntimeDbType>('DB_TYPE');
  const dbType: RuntimeDbType =
    configuredDbType ?? (databaseUrl ? 'postgres' : 'sqlite');
  const dataSourceType = resolveDataSourceType(dbType);

  const packageRoot = getPackageRoot();
  const isTsNode =
    process.env.TS_NODE === 'true' ||
    !!process.env.JEST_WORKER_ID ||
    process.env.NODE_ENV === 'test';

  const entities = isTsNode
    ? [join(packageRoot, 'src/**/*.entity.ts')]
    : [join(packageRoot, 'dist/**/*.entity.js')];
  const migrations = isTsNode
    ? [join(packageRoot, 'src/migrations/*.ts')]
    : [join(packageRoot, 'dist/migrations/*.js')];

  if (process.env.NODE_ENV === 'test') {
    console.log('Entities:', entities, 'Migrations:', migrations);
  }

  const baseConfig = {
    entities,
    migrations,
    synchronize: false,
    logging: configService.get<string>('DB_LOGGING') === 'true',
  };

  if (dataSourceType === 'better-sqlite3') {
    return {
      ...baseConfig,
      type: dataSourceType,
      database: getSqlitePath(),
    } as DataSourceOptions;
  }

  return {
    ...baseConfig,
    type: dataSourceType,
    url: databaseUrl,
  } as DataSourceOptions;
};

export const createDataSource = (): DataSource => {
  loadRuntimeEnv();
  const configService = new ConfigService();
  return new DataSource(getTypeOrmConfig(configService));
};

// Exporting a DataSource for CLI usage (TypeORM CLI needs this)
export default createDataSource();
