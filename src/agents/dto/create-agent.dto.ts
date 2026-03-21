import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  profile: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsUUID()
  @IsNotEmpty()
  modelId: string;
}
