import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Sse,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './entities/task.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProjectsService } from '../projects/projects.service';

@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Sse('events')
  async events(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.subscribeToProjectTasks(projectId);
  }

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.create({ ...createTaskDto, projectId });
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Query('status') status?: TaskStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.findAll(projectId, { status, page, limit });
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.findOne(id, projectId);
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.update(id, updateTaskDto, projectId);
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.tasksService.remove(id, projectId);
  }
}
