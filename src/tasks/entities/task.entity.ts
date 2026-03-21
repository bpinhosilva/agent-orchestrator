import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Project } from '../../projects/entities/project.entity';

export enum TaskStatus {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG,
  })
  status: TaskStatus;

  @Column({
    type: 'int',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ManyToOne(() => Agent, { nullable: true, eager: true, onDelete: 'SET NULL' })
  assignee: Agent;

  @ManyToOne(() => Project, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
