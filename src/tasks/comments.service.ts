import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TaskComment, CommentAuthorType } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Task } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentsRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async create(taskId: string, createCommentDto: CreateCommentDto) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      task,
      authorType: createCommentDto.authorType,
      authorUser:
        createCommentDto.authorType === CommentAuthorType.USER &&
        createCommentDto.authorUserId
          ? ({ id: createCommentDto.authorUserId } as User)
          : null,
      authorAgent:
        createCommentDto.authorType === CommentAuthorType.AGENT &&
        createCommentDto.authorAgentId
          ? ({ id: createCommentDto.authorAgentId } as AgentEntity)
          : null,
      artifacts:
        createCommentDto.artifacts?.map((artifact) => ({
          id: artifact.id || crypto.randomUUID(),
          ...artifact,
        })) || null,
    });

    return this.commentsRepository.save(comment);
  }

  async findAllByTask(taskId: string) {
    return this.commentsRepository.find({
      where: { task: { id: taskId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, taskId?: string) {
    const where: FindOptionsWhere<TaskComment> = { id };
    if (taskId) {
      where.task = { id: taskId };
    }
    const comment = await this.commentsRepository.findOne({ where });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async remove(id: string, taskId?: string) {
    const comment = await this.findOne(id, taskId);
    await this.commentsRepository.remove(comment);
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    taskId?: string,
  ) {
    const comment = await this.findOne(id, taskId);

    if (updateCommentDto.content !== undefined) {
      comment.content = updateCommentDto.content;
    }

    if (updateCommentDto.artifacts !== undefined) {
      comment.artifacts =
        updateCommentDto.artifacts?.map((artifact) => ({
          id: artifact.id || crypto.randomUUID(),
          ...artifact,
        })) || null;
    }

    return this.commentsRepository.save(comment);
  }
}
