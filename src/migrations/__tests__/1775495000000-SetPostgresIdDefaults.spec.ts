import { QueryRunner } from 'typeorm';
import { SetPostgresIdDefaults1775495000000 } from '../1775495000000-SetPostgresIdDefaults';

function createQueryRunner(
  driverType: QueryRunner['connection']['options']['type'],
): QueryRunner {
  return {
    connection: {
      options: {
        type: driverType,
      },
    },
    query: jest.fn(),
  } as unknown as QueryRunner;
}

describe('SetPostgresIdDefaults1775495000000', () => {
  it('is a no-op for sqlite', async () => {
    const migration = new SetPostgresIdDefaults1775495000000();
    const queryRunner = createQueryRunner('better-sqlite3');

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(queryRunner.query as jest.Mock).not.toHaveBeenCalled();
  });

  it('applies id defaults for postgres', async () => {
    const migration = new SetPostgresIdDefaults1775495000000();
    const queryRunner = createQueryRunner('postgres');

    await migration.up(queryRunner);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(queryRunner.query as jest.Mock).toHaveBeenCalledWith(
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(queryRunner.query as jest.Mock).toHaveBeenCalledWith(
      `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(queryRunner.query as jest.Mock).toHaveBeenCalledWith(
      `ALTER TABLE "system_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
    );
  });
});
