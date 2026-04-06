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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from './tasks.service';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  private async verifyTaskAccess(taskId: string, user: User) {
    const task = await this.tasksService.findOne(taskId);
    await this.projectsService.findOne(
      task.project?.id || task.projectId,
      user,
    );
  }

  @Post()
  async create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    await this.verifyTaskAccess(taskId, user);
    return this.commentsService.create(taskId, createCommentDto);
  }

  @Get()
  async findAll(@Param('taskId') taskId: string, @CurrentUser() user: User) {
    await this.verifyTaskAccess(taskId, user);
    return this.commentsService.findAllByTask(taskId);
  }

  @Get(':id')
  async findOne(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.verifyTaskAccess(taskId, user);
    return this.commentsService.findOne(id, taskId);
  }

  @Delete(':id')
  async remove(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.verifyTaskAccess(taskId, user);
    return this.commentsService.remove(id, taskId);
  }

  @Patch(':id')
  async update(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: User,
  ) {
    await this.verifyTaskAccess(taskId, user);
    return this.commentsService.update(id, updateCommentDto, taskId);
  }
}
