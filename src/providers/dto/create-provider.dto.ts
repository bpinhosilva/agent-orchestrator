import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;
}
