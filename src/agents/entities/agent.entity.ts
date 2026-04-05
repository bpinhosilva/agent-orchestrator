import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Model } from '../../models/entities/model.entity';
import { Provider } from '../../providers/entities/provider.entity';
import {
  DEFAULT_AGENT_EMOJI,
  type AgentEmojiValue,
} from '../agent-emoji.constants';
import { type AgentAttributes } from '../dto/agent-attributes.dto';

@Entity('agents')
export class AgentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  systemInstructions: string;

  @Column({ type: 'text', nullable: true })
  role: string | null;

  @Column({ type: 'text', nullable: true })
  status: string | null;

  @Column({ type: 'text', default: DEFAULT_AGENT_EMOJI })
  emoji: AgentEmojiValue;

  @Column({ type: 'simple-json', nullable: true })
  attributes: AgentAttributes | null;

  @Index()
  @ManyToOne(() => Provider, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'providerId' })
  provider: Provider | null;

  @Index()
  @ManyToOne(() => Model, (model) => model.agents, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  model: Model | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
