import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CommentAuthorType } from '../entities/comment.entity';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsEnum(CommentAuthorType)
  @IsOptional()
  authorType?: CommentAuthorType;

  @IsUUID()
  @IsOptional()
  authorUserId?: string;

  @IsUUID()
  @IsOptional()
  authorAgentId?: string;
}
