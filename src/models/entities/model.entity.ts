import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from '../../providers/entities/provider.entity';
import { AgentEntity } from '../../agents/entities/agent.entity';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Provider, (provider) => provider.models, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @OneToMany(() => AgentEntity, (agent) => agent.model)
  agents: AgentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
