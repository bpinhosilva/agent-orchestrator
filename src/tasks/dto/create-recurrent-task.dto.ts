import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { RecurrentTaskStatus } from '../entities/recurrent-task.entity';
import { TaskPriority } from '../entities/task.entity';

export class CreateRecurrentTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsEnum(RecurrentTaskStatus)
  @IsOptional()
  status?: RecurrentTaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  @Type(() => Number)
  priority?: TaskPriority;

  @IsString()
  @IsNotEmpty()
  cronExpression: string;

  @IsUUID()
  @IsNotEmpty()
  assigneeId: string;
}
