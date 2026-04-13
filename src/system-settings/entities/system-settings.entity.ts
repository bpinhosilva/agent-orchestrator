import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JSON_COLUMN_TYPE } from '../../config/typeorm';

export interface SystemSettingsData {
  taskScheduler: {
    pollIntervalInMs: number;
    maxTaskPerExecution: number;
  };
  recurrentTasksScheduler: {
    pollIntervalInMs: number;
    executionTimeout: number;
    maxActiveTasks: number;
  };
}

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: JSON_COLUMN_TYPE })
  data: SystemSettingsData;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
