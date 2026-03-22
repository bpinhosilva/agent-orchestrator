import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  systemInstructions?: string;

  @IsString()
  @IsNotEmpty()
  modelId: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  provider?: string;
}
