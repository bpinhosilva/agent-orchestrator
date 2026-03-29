import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { RecurrentTaskExec } from './recurrent-task-exec.entity';
import { TaskPriority } from './task.entity';

export enum RecurrentTaskStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
}

@Entity('recurrent_tasks')
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

  @OneToMany(() => RecurrentTaskExec, (exec) => exec.recurrentTask)
  executions: RecurrentTaskExec[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
