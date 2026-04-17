import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min, ValidateNested } from 'class-validator';

export class TaskSchedulerSettingsDto {
  @IsInt()
  @Min(10000, {
    message: 'pollIntervalInMs must not be less than 10000 (10 seconds)',
  })
  pollIntervalInMs: number;

  @IsInt()
  @Min(1, { message: 'maxTaskPerExecution must be at least 1' })
  @Max(15, { message: 'maxTaskPerExecution must not exceed 15' })
  maxTaskPerExecution: number;
}

export class RecurrentTasksSchedulerSettingsDto {
  @IsInt()
  @Min(15000, {
    message: 'pollIntervalInMs must not be less than 15000 (15 seconds)',
  })
  pollIntervalInMs: number;

  @IsInt()
  @Min(60000, {
    message: 'executionTimeout must not be less than 60000 (1 minute)',
  })
  executionTimeout: number;

  @IsInt()
  @Min(1, { message: 'maxActiveTasks must be at least 1' })
  @Max(5, { message: 'maxActiveTasks must not exceed 5' })
  maxActiveTasks: number;
}

export class SystemSettingsDataDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TaskSchedulerSettingsDto)
  taskScheduler: TaskSchedulerSettingsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RecurrentTasksSchedulerSettingsDto)
  recurrentTasksScheduler: RecurrentTasksSchedulerSettingsDto;
}

export class UpdateSystemSettingsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SystemSettingsDataDto)
  data: SystemSettingsDataDto;
}
