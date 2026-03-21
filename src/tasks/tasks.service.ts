import { Injectable, NotFoundException } from '@nestjs/common';
import { Project } from '../projects/entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { Agent } from '../agents/entities/agent.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status ?? TaskStatus.BACKLOG,
      priority: createTaskDto.priority ?? TaskPriority.MEDIUM,
      project: { id: createTaskDto.projectId } as Project,
    });

    if (createTaskDto.assigneeId) {
      task.assignee = { id: createTaskDto.assigneeId } as Agent;
    }

    return this.tasksRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (updateTaskDto.assigneeId) {
      task.assignee = { id: updateTaskDto.assigneeId } as Agent;
    } else if (updateTaskDto.assigneeId === null) {
      task.assignee = null as unknown as Agent;
    }

    if (updateTaskDto.title !== undefined) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      task.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) task.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined)
      task.priority = updateTaskDto.priority;

    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
