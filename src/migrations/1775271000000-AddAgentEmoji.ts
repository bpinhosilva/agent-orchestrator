import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { DEFAULT_AGENT_EMOJI } from '../agents/agent-emoji.constants';

export class AddAgentEmoji1775271000000 implements MigrationInterface {
  name = 'AddAgentEmoji1775271000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'agents',
      new TableColumn({
        name: 'emoji',
        type: 'varchar',
        isNullable: false,
        default: `'${DEFAULT_AGENT_EMOJI}'`,
      }),
    );

    await queryRunner.query(
      `UPDATE "agents" SET "emoji" = '${DEFAULT_AGENT_EMOJI}' WHERE "emoji" IS NULL OR "emoji" = ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('agents', 'emoji');
  }
}
