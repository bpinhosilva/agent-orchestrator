import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  providerId: string;
}
