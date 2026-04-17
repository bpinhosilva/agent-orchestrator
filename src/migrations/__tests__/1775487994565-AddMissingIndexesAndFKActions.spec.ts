import { QueryRunner } from 'typeorm';
import { AddMissingIndexesAndFKActions20260406 } from '../1775487994565-20260406-AddMissingIndexesAndFKActions';

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

describe('AddMissingIndexesAndFKActions20260406', () => {
  it('is a no-op for postgres up/down', async () => {
    const migration = new AddMissingIndexesAndFKActions20260406();
    const queryRunner = createQueryRunner('postgres');

    await migration.up(queryRunner);
    await migration.down(queryRunner);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(queryRunner.query as jest.Mock).not.toHaveBeenCalled();
  });
});
