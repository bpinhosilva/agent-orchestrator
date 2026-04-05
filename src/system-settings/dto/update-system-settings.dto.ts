import { IsObject } from 'class-validator';

export class UpdateSystemSettingsDto {
  @IsObject()
  data: any;
}
