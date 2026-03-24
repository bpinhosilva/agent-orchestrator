import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsUUID()
  @IsOptional()
  ownerAgentId?: string | null;
}
