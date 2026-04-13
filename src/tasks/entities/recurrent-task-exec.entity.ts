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
import { Artifact } from '../../common/interfaces/artifact.interface';

export enum ExecStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELED = 'canceled',
}

@Entity('recurrent_task_execs')
@Index(['recurrentTask', 'createdAt'])
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

  @Column({ type: 'simple-json', nullable: true })
  artifacts: Artifact[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
