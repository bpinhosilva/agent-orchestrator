import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(AgentEntity)
    private readonly agentsRepository: Repository<AgentEntity>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    if (
      createTaskDto.status === TaskStatus.DONE ||
      createTaskDto.status === TaskStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Protocols cannot be initialized in DONE or ARCHIVED state.',
      );
    }
    const { projectId, assigneeId, ...rest } = createTaskDto;
    const task = this.tasksRepository.create({
      ...rest,
      status: createTaskDto.status ?? TaskStatus.BACKLOG,
      priority: createTaskDto.priority ?? TaskPriority.MEDIUM,
      project: { id: projectId } as Project,
      assignee: assigneeId ? ({ id: assigneeId } as AgentEntity) : null,
    });
    return this.tasksRepository.save(task);
  }

  async findAll(
    projectId: string,
    options: { status?: TaskStatus; page?: number; limit?: number } = {},
  ): Promise<{ items: Task[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 50 } = options;
    const where: FindOptionsWhere<Task> = { project: { id: projectId } };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.tasksRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { updatedAt: 'DESC' }, // Default order
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, projectId?: string): Promise<Task> {
    const where: FindOptionsWhere<Task> = { id };
    if (projectId) {
      where.project = { id: projectId };
    }
    const task = await this.tasksRepository.findOne({ where });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    projectId?: string,
  ): Promise<Task> {
    const task = await this.findOne(id, projectId);

    if (updateTaskDto.assigneeId) {
      task.assignee = { id: updateTaskDto.assigneeId } as AgentEntity;
    } else if (updateTaskDto.assigneeId === null) {
      task.assignee = null;
    }

    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      task.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined)
      task.priority = updateTaskDto.priority;

    return this.tasksRepository.save(task);
  }

  async remove(id: string, projectId?: string): Promise<void> {
    const task = await this.findOne(id, projectId);
    await this.tasksRepository.remove(task);
  }
}
