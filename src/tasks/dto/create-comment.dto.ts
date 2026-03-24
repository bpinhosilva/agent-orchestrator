import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CommentAuthorType } from '../entities/comment.entity';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(CommentAuthorType)
  @IsNotEmpty()
  authorType: CommentAuthorType;

  @IsUUID()
  @IsOptional()
  authorUserId?: string;

  @IsUUID()
  @IsOptional()
  authorAgentId?: string;

  @IsOptional()
  artifacts?: {
    id?: string;
    originalName: string;
    mimeType: string;
    filePath: string;
  }[];
}
