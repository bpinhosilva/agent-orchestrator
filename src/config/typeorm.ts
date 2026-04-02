import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join, resolve } from 'path';

const APP_HOME = process.env.AGENT_ORCHESTRATOR_HOME;
const ENV_PATH = APP_HOME ? join(APP_HOME, '.env') : undefined;

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const dbType =
    configService.get<string>('DB_TYPE') ||
    (databaseUrl ? 'postgres' : 'sqlite');

  const packageRoot = resolve(__dirname, '..', '..');
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

  const sqlitePath = APP_HOME
    ? join(APP_HOME, 'local.sqlite')
    : join(packageRoot, 'local.sqlite');

  return {
    type: dbType as 'sqlite' | 'postgres',
    url: databaseUrl,
    database: databaseUrl ? undefined : sqlitePath,
    entities,
    migrations,
    synchronize: false,
    logging: configService.get<string>('DB_LOGGING') === 'true',
  } as DataSourceOptions;
};

export const createDataSource = (): DataSource => {
  if (ENV_PATH) {
    config({ path: ENV_PATH, override: true });
  } else {
    config({ override: true }); // Fallback to current dir if AGENT_ORCHESTRATOR_HOME not set
  }
  const configService = new ConfigService();
  return new DataSource(getTypeOrmConfig(configService));
};

// Exporting a DataSource for CLI usage (TypeORM CLI needs this)
export default createDataSource();
