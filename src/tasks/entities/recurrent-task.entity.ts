import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { RecurrentTaskExec } from './recurrent-task-exec.entity';
import { TaskPriority } from './task.entity';
import { Project } from '../../projects/entities/project.entity';

export enum RecurrentTaskStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}

@Entity('recurrent_tasks')
@Index(['status'])
export class RecurrentTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: RecurrentTaskStatus,
    default: RecurrentTaskStatus.ACTIVE,
  })
  status: RecurrentTaskStatus;

  @Column({
    type: 'int',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column()
  cronExpression: string;

  @ManyToOne(() => AgentEntity, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  assignee: AgentEntity;

  @Index()
  @ManyToOne(() => Project, {
    nullable: true,
    eager: false,
    onDelete: 'CASCADE',
  })
  project: Project | null;

  @OneToMany(() => RecurrentTaskExec, (exec) => exec.recurrentTask)
  executions: RecurrentTaskExec[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
