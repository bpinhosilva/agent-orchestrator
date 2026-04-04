import { normalizeMigrationSqlForDriver } from '../../database/migration-sql.utils';

describe('normalizeMigrationSqlForDriver', () => {
  it('converts sqlite datetime syntax to postgres-compatible SQL', () => {
    const sql =
      `CREATE TABLE "users" (` +
      `"createdAt" datetime NOT NULL DEFAULT (datetime('now')), ` +
      `"revokedAt" datetime)`;

    expect(normalizeMigrationSqlForDriver('postgres', sql)).toBe(
      `CREATE TABLE "users" (` +
        `"createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, ` +
        `"revokedAt" timestamp)`,
    );
  });

  it('leaves sqlite SQL unchanged', () => {
    const sql =
      `CREATE TABLE "users" (` +
      `"createdAt" datetime NOT NULL DEFAULT (datetime('now')))`;

    expect(normalizeMigrationSqlForDriver('better-sqlite3', sql)).toBe(sql);
  });
});
