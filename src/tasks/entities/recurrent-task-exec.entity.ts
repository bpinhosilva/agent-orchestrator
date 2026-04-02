import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RecurrentTask } from './recurrent-task.entity';

export enum ExecStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELED = 'canceled',
}

@Entity('recurrent_task_execs')
export class RecurrentTaskExec {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => RecurrentTask, (rt) => rt.executions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  recurrentTask: RecurrentTask;

  @Column({
    type: 'varchar',
    enum: ExecStatus,
    default: ExecStatus.RUNNING,
  })
  status: ExecStatus;

  @Column('text', { nullable: true })
  result: string;

  @Column('int', { nullable: true })
  latencyMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
