import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AgentRequestDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  input: string;
}
