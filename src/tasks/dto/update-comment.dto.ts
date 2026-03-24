import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  artifacts?: {
    id?: string;
    originalName: string;
    mimeType: string;
    filePath: string;
  }[];
}
