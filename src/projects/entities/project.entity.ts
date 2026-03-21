import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @ManyToOne(() => Agent, {
    nullable: false,
    eager: true,
    onDelete: 'RESTRICT',
  })
  defaultAgent: Agent;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
