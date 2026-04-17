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

  it('removes explicit unique constraint names on temporary table creates for postgres', () => {
    const sql =
      `CREATE TABLE "temporary_agents" (` +
      `"id" varchar PRIMARY KEY NOT NULL, ` +
      `CONSTRAINT "UQ_1ea6b2ce044724d3254d19ab922" UNIQUE ("name"))`;

    expect(normalizeMigrationSqlForDriver('postgres', sql)).toBe(
      `CREATE TABLE "temporary_agents" (` +
        `"id" varchar PRIMARY KEY NOT NULL, ` +
        `UNIQUE ("name"))`,
    );
  });

  it('leaves sqlite SQL unchanged', () => {
    const sql =
      `CREATE TABLE "users" (` +
      `"createdAt" datetime NOT NULL DEFAULT (datetime('now')))`;

    expect(normalizeMigrationSqlForDriver('better-sqlite3', sql)).toBe(sql);
  });
});
