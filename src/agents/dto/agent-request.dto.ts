import { IsString, IsNotEmpty } from 'class-validator';

export class AgentRequestDto {
  @IsString()
  @IsNotEmpty()
  input: string;
}
