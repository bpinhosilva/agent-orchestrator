import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from '../../providers/entities/provider.entity';
import { Agent } from '../../agents/entities/agent.entity';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Provider, (provider) => provider.models, {
    onDelete: 'CASCADE',
  })
  provider: Provider;

  @OneToMany(() => Agent, (agent) => agent.model)
  agents: Agent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
