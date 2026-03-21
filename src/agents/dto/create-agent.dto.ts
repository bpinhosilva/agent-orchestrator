import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  profile: string;

  @IsUUID()
  @IsNotEmpty()
  modelId: string;
}
