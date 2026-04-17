import { QueryRunner } from 'typeorm';

export function normalizeMigrationSqlForDriver(
  driverType: QueryRunner['connection']['options']['type'],
  sql: string,
): string {
  if (driverType !== 'postgres') {
    return sql;
  }

  let normalizedSql = sql
    .replaceAll("(datetime('now'))", 'CURRENT_TIMESTAMP')
    .replaceAll("datetime('now')", 'CURRENT_TIMESTAMP')
    .replace(/\bdatetime\b/g, 'timestamp');

  if (normalizedSql.includes('CREATE TABLE "temporary_')) {
    normalizedSql = normalizedSql.replace(
      /CONSTRAINT\s+"UQ_[^"]+"\s+UNIQUE/g,
      'UNIQUE',
    );
  }

  return normalizedSql;
}
