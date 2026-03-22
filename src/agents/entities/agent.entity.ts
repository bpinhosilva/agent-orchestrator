import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Model } from '../../models/entities/model.entity';
import { Project } from '../../projects/entities/project.entity';

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

  @Column({ type: 'text', nullable: true })
  provider: string | null;

  @ManyToOne(() => Model, (model) => model.agents, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  model: Model | null;

  @ManyToOne(() => Project, (project) => project.agents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  project: Project | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
