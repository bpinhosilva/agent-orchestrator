import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export const ATTRIBUTES_MIN = 1;
export const ATTRIBUTES_MAX = 5;
export const BALANCED_ATTRIBUTES = {
  creativity: 3.0,
  strictness: 3.5,
} as const;

export class AgentAttributesDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ATTRIBUTES_MIN)
  @Max(ATTRIBUTES_MAX)
  creativity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ATTRIBUTES_MIN)
  @Max(ATTRIBUTES_MAX)
  strictness?: number;
}

export interface AgentAttributes {
  creativity?: number;
  strictness?: number;
}
