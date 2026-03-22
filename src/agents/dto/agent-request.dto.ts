import { IsString, IsNotEmpty } from 'class-validator';

export class AgentRequestDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  input: string;
}
