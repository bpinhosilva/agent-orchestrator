import * as fs from 'fs';
import * as path from 'path';
import { gzipSync } from 'zlib';
import { Command } from 'commander';
import { createDataSource, isSqliteDriver } from '../../config/typeorm';
import { PID_DIR } from '../constants';
import { resolveActionOptions } from '../utils';
import type { BackupCommandOptions } from '../types';

type BackupTarget = 'db';
type SupportedDbType = 'sqlite' | 'postgres';
const DEFAULT_BACKUP_DESTINATION = path.join(PID_DIR, 'backups');

interface TableRef {
  name: string;
  schema?: string;
}

interface SqliteTableRow {
  name: string;
}

interface PostgresTableRow {
  table_schema: string;
  table_name: string;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function buildTimestamp(now = new Date()): string {
  const y = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${y}${mm}${dd}-${hh}${mi}${ss}-${ms}`;
}

function detectDbType(type: unknown): SupportedDbType {
  if (isSqliteDriver(type as never)) {
    return 'sqlite';
  }
  if (type === 'postgres') {
    return 'postgres';
  }
  throw new Error(
    `Unsupported database type "${String(type)}". Backup currently supports sqlite and postgres.`,
  );
}

async function listTables(
  dbType: SupportedDbType,
  query: (sql: string) => Promise<unknown>,
): Promise<TableRef[]> {
  if (dbType === 'sqlite') {
    const rows = (await query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )) as SqliteTableRow[];
    return rows.map((row) => ({ name: row.name }));
  }

  const rows = (await query(
    "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name",
  )) as PostgresTableRow[];

  return rows.map((row) => ({
    name: row.table_name,
    schema: row.table_schema,
  }));
}

function tableSelectSql(dbType: SupportedDbType, table: TableRef): string {
  if (dbType === 'sqlite') {
    return `SELECT * FROM ${quoteIdentifier(table.name)}`;
  }
  const schema = table.schema ?? 'public';
  return `SELECT * FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table.name)}`;
}

async function fetchTableRows(
  query: (sql: string) => Promise<unknown>,
  sql: string,
): Promise<unknown[]> {
  const result = await query(sql);
  if (!Array.isArray(result)) {
    return [];
  }
  return result as unknown[];
}

export function registerBackupCommand(program: Command): void {
  program
    .command('backup <target>')
    .description('Create runtime backups (currently supports database only)')
    .option(
      '-d, --destination <path>',
      'Destination folder for backup files',
      DEFAULT_BACKUP_DESTINATION,
    )
    .action(async (target: string, ...args: unknown[]) => {
      const opts = resolveActionOptions<BackupCommandOptions>(args);
      if (target !== 'db') {
        console.error(
          `Unsupported backup target "${target}". Only "db" is currently supported.`,
        );
        process.exitCode = 1;
        return;
      }

      const destination = opts.destination ?? DEFAULT_BACKUP_DESTINATION;
      const timestamp = buildTimestamp();
      const filename = `agent-orchestrator-backup-${target}-${timestamp}.json.gz`;
      const outputPath = path.join(destination, filename);

      fs.mkdirSync(destination, { recursive: true });

      const dataSource = createDataSource();
      try {
        await dataSource.initialize();
        const dbType = detectDbType(dataSource.options.type);
        const tables = await listTables(dbType, (sql) => dataSource.query(sql));
        const tableData = await Promise.all(
          tables.map(async (table) => {
            const rows = await fetchTableRows(
              (sql) => dataSource.query(sql),
              tableSelectSql(dbType, table),
            );
            return {
              name: table.name,
              ...(table.schema ? { schema: table.schema } : {}),
              rows,
            };
          }),
        );

        const backupPayload = {
          target: target as BackupTarget,
          dbType,
          createdAt: new Date().toISOString(),
          tableCount: tableData.length,
          tables: tableData,
        };

        const compressed = gzipSync(Buffer.from(JSON.stringify(backupPayload)));
        fs.writeFileSync(outputPath, compressed);
        console.log(`Backup created: ${outputPath}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Backup failed: ${errorMessage}`);
        process.exitCode = 1;
      } finally {
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
      }
    });
}
