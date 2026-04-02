import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  systemInstructions?: string;

  @IsString()
  @IsNotEmpty()
  modelId: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsUUID()
  @IsNotEmpty()
  providerId: string;
}
