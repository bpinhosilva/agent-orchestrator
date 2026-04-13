import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AGENT_EMOJI_VALUES,
  type AgentEmojiValue,
} from '../agent-emoji.constants';
import { AgentAttributesDto } from './agent-attributes.dto';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentAttributesDto)
  attributes?: AgentAttributesDto;
}
