import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RecurrentTasksService } from './recurrent-tasks.service';
import { CreateRecurrentTaskDto } from './dto/create-recurrent-task.dto';
import { UpdateRecurrentTaskDto } from './dto/update-recurrent-task.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProjectsService } from '../projects/projects.service';

@Controller('projects/:projectId/recurrent-tasks')
export class RecurrentTasksController {
  constructor(
    private readonly service: RecurrentTasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRecurrentTaskDto,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.service.create(dto, projectId);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.service.findAll(projectId);
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.service.findOne(id, projectId);
  }

  @Patch(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurrentTaskDto,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.service.update(id, dto, projectId);
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.service.remove(id, projectId);
  }

  @Get(':id/executions')
  async findExecutions(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: User,
  ) {
    await this.projectsService.findOne(projectId, user);
    return this.service.findExecutions(id, projectId, page, limit);
  }
}
