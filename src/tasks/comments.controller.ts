import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, createCommentDto);
  }

  @Get()
  findAll(@Param('taskId') taskId: string) {
    return this.commentsService.findAllByTask(taskId);
  }

  @Get(':id')
  findOne(@Param('taskId') taskId: string, @Param('id') id: string) {
    return this.commentsService.findOne(id, taskId);
  }

  @Delete(':id')
  remove(@Param('taskId') taskId: string, @Param('id') id: string) {
    return this.commentsService.remove(id, taskId);
  }

  @Patch(':id')
  update(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, updateCommentDto, taskId);
  }
}
