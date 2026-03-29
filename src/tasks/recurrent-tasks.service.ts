import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecurrentTask,
  RecurrentTaskStatus,
} from './entities/recurrent-task.entity';
import { CreateRecurrentTaskDto } from './dto/create-recurrent-task.dto';
import { UpdateRecurrentTaskDto } from './dto/update-recurrent-task.dto';
import { AgentEntity } from '../agents/entities/agent.entity';

import { RecurrentTaskSchedulerService } from './recurrent-task-scheduler.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class RecurrentTasksService {
  constructor(
    @InjectRepository(RecurrentTask)
    private readonly repository: Repository<RecurrentTask>,
    @Inject(forwardRef(() => RecurrentTaskSchedulerService))
    private readonly schedulerService: RecurrentTaskSchedulerService,
  ) {}

  async create(dto: CreateRecurrentTaskDto): Promise<RecurrentTask> {
    const activeCount = await this.repository.count({
      where: { status: RecurrentTaskStatus.ACTIVE },
    });

    if (dto.status !== RecurrentTaskStatus.PAUSED && activeCount >= 5) {
      throw new BadRequestException(
        'Maximum amount of active recurrent tasks (5) reached.',
      );
    }

    const task = this.repository.create({
      ...dto,
      status: dto.status ?? RecurrentTaskStatus.ACTIVE,
      assignee: { id: dto.assigneeId } as AgentEntity,
    });
    return this.repository.save(task);
  }

  async findAll(): Promise<any[]> {
    const tasks = await this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect(
        'task.executions',
        'execution',
        'execution.id = (SELECT e.id FROM recurrent_task_execs e WHERE e.recurrentTaskId = task.id ORDER BY e.updatedAt DESC LIMIT 1)',
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    return tasks.map((task) => ({
      ...task,
      lastRun: task.executions?.[0]?.updatedAt || null,
    }));
  }

  async findOne(id: string): Promise<any> {
    const task = await this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect(
        'task.executions',
        'execution',
        'execution.id = (SELECT e.id FROM recurrent_task_execs e WHERE e.recurrentTaskId = task.id ORDER BY e.updatedAt DESC LIMIT 1)',
      )
      .where('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException(`Recurrent task ${id} not found`);
    }

    return {
      ...task,
      lastRun: task.executions?.[0]?.updatedAt || null,
    };
  }

  async update(id: string, dto: UpdateRecurrentTaskDto): Promise<any> {
    const task = await this.repository.findOne({
      where: { id },
      relations: ['assignee'],
    });
    if (!task) {
      throw new NotFoundException(`Recurrent task ${id} not found`);
    }

    if (
      dto.status === RecurrentTaskStatus.ACTIVE &&
      task.status !== RecurrentTaskStatus.ACTIVE
    ) {
      const activeCount = await this.repository.count({
        where: { status: RecurrentTaskStatus.ACTIVE },
      });
      if (activeCount >= 5) {
        throw new BadRequestException(
          'Maximum amount of active recurrent tasks (5) reached.',
        );
      }
    }

    if (dto.assigneeId) {
      task.assignee = { id: dto.assigneeId } as AgentEntity;
    }
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.cronExpression !== undefined)
      task.cronExpression = dto.cronExpression;

    await this.repository.save(task);

    // If task was paused or deleted, immediately stop it in the scheduler
    if (dto.status === RecurrentTaskStatus.PAUSED) {
      try {
        this.schedulerService.unregisterTasks(id);
      } catch (error: unknown) {
        // Log but don't fail the update if it was already stopped
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error unregistering task ${id}:`, message);
      }
    }

    return this.findOne(id); // Return mapped object with lastRun
  }

  async remove(id: string): Promise<void> {
    const task = await this.repository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Recurrent task ${id} not found`);
    }

    // 1. Explicitly stop and unregister from memory scheduler
    this.schedulerService.unregisterTasks(id);

    // 2. Remove from database
    await this.repository.remove(task);
  }
}
