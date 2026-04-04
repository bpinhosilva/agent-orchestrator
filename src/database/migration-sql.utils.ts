import { QueryRunner } from 'typeorm';

export function normalizeMigrationSqlForDriver(
  driverType: QueryRunner['connection']['options']['type'],
  sql: string,
): string {
  if (driverType !== 'postgres') {
    return sql;
  }

  return sql
    .replace(/DEFAULT\s+\(datetime\('now'\)\)/g, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/\bdatetime\b/g, 'timestamp');
}
