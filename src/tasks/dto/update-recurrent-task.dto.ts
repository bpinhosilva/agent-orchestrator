import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurrentTaskDto } from './create-recurrent-task.dto';

export class UpdateRecurrentTaskDto extends PartialType(
  CreateRecurrentTaskDto,
) {}
