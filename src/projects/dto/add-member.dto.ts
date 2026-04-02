import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectMemberRole } from '../entities/project-member.entity';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectMemberRole)
  @IsOptional()
  role?: ProjectMemberRole;
}
