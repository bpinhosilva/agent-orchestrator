import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  AGENT_EMOJI_VALUES,
  type AgentEmojiValue,
} from '../agent-emoji.constants';

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

  @IsString()
  @IsOptional()
  @IsIn(AGENT_EMOJI_VALUES)
  emoji?: AgentEmojiValue;

  @IsUUID()
  @IsNotEmpty()
  providerId: string;
}
