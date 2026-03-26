import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TaskComment, CommentAuthorType } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Task } from './entities/task.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../common/storage.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentsRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(AgentEntity)
    private readonly agentsRepository: Repository<AgentEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  async create(taskId: string, createCommentDto: CreateCommentDto) {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!createCommentDto.authorUserId && !createCommentDto.authorAgentId) {
      throw new BadRequestException(
        'Either authorUserId or authorAgentId must be provided',
      );
    }

    const authorType =
      createCommentDto.authorType ||
      (createCommentDto.authorUserId
        ? CommentAuthorType.USER
        : CommentAuthorType.AGENT);

    let authorUser: User | null = null;
    let authorAgent: AgentEntity | null = null;

    if (
      authorType === CommentAuthorType.USER &&
      createCommentDto.authorUserId
    ) {
      authorUser = await this.usersRepository.findOne({
        where: { id: createCommentDto.authorUserId },
      });
      if (!authorUser) {
        throw new NotFoundException(
          `User with ID ${createCommentDto.authorUserId} not found`,
        );
      }
    } else if (
      authorType === CommentAuthorType.AGENT &&
      createCommentDto.authorAgentId
    ) {
      authorAgent = await this.agentsRepository.findOne({
        where: { id: createCommentDto.authorAgentId },
      });
      if (!authorAgent) {
        throw new NotFoundException(
          `Agent with ID ${createCommentDto.authorAgentId} not found`,
        );
      }
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      task,
      authorType,
      authorUser,
      authorAgent,
      artifacts:
        createCommentDto.artifacts?.map((artifact) => ({
          id: artifact.id || crypto.randomUUID(),
          ...artifact,
        })) || null,
    });

    const savedComment = await this.commentsRepository.save(comment);
    return this.findOne(savedComment.id);
  }

  async findAllByTask(taskId: string) {
    return this.commentsRepository.find({
      where: { task: { id: taskId } },
      relations: ['authorUser', 'authorAgent'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, taskId?: string) {
    const where: FindOptionsWhere<TaskComment> = { id };
    if (taskId) {
      where.task = { id: taskId };
    }
    const comment = await this.commentsRepository.findOne({
      where,
      relations: ['authorUser', 'authorAgent'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async remove(id: string, taskId?: string) {
    const comment = await this.findOne(id, taskId);

    // Delete associated artifacts from disk
    if (comment.artifacts && comment.artifacts.length > 0) {
      for (const artifact of comment.artifacts) {
        try {
          await this.storageService.delete(artifact.filePath);
        } catch (error) {
          console.error(
            `Failed to delete artifact file ${artifact.filePath}:`,
            error,
          );
        }
      }
    }

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
