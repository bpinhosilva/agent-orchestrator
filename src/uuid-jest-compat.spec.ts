import 'reflect-metadata';
import { Column, DataSource, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('uuid_jest_probe')
class UuidJestProbe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;
}

describe('jest uuid compatibility', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('generates sqlite UUID primary keys through TypeORM insert logic under Jest', async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [UuidJestProbe],
      synchronize: true,
    });

    await dataSource.initialize();

    expect(dataSource.driver.isUUIDGenerationSupported()).toBe(false);

    await dataSource
      .createQueryBuilder()
      .insert()
      .into(UuidJestProbe)
      .values({ name: 'probe' })
      .execute();

    const insertedRecord = await dataSource
      .getRepository(UuidJestProbe)
      .findOneBy({
        name: 'probe',
      });

    expect(insertedRecord).not.toBeNull();
    expect(insertedRecord?.name).toBe('probe');
    expect(insertedRecord?.id).toEqual(expect.any(String));
  });
});
