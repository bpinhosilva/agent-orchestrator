import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { getPackageRoot, getSqlitePath, loadRuntimeEnv } from './runtime-paths';

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const dbType =
    configService.get<string>('DB_TYPE') ||
    (databaseUrl ? 'postgres' : 'sqlite');

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

  return {
    type: dbType as 'sqlite' | 'postgres',
    url: databaseUrl,
    database: databaseUrl ? undefined : getSqlitePath(),
    entities,
    migrations,
    synchronize: false,
    logging: configService.get<string>('DB_LOGGING') === 'true',
  } as DataSourceOptions;
};

export const createDataSource = (): DataSource => {
  loadRuntimeEnv();
  const configService = new ConfigService();
  return new DataSource(getTypeOrmConfig(configService));
};

// Exporting a DataSource for CLI usage (TypeORM CLI needs this)
export default createDataSource();
