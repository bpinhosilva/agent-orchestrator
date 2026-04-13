import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  RelationId,
} from 'typeorm';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { Project } from '../../projects/entities/project.entity';
import { TaskComment } from './comment.entity';

export enum TaskStatus {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived',
}

export enum TaskPriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

@Entity('tasks')
@Index(['project', 'status', 'updatedAt'])
@Index(['project', 'updatedAt'])
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

  @Column('float', { default: 0 })
  costEstimate: number;

  @Column('int', { default: 0 })
  llmLatency: number;

  @Index()
  @ManyToOne(() => AgentEntity, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  assignee: AgentEntity | null;

  @ManyToOne(() => Project, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  project: Project;

  @RelationId((task: Task) => task.project)
  projectId: string;

  @OneToMany(() => TaskComment, (comment) => comment.task)
  comments: TaskComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
