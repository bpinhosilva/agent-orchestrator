import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

function toOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export class ListUsersQueryDto {
  @Transform(({ value }) => toOptionalInteger(value))
  page?: number;

  @Transform(({ value }) => toOptionalInteger(value))
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : undefined,
  )
  search?: string;
}
