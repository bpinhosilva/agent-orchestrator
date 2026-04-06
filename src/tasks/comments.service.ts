import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(CommentsService.name);

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
    return this.commentsRepository.manager.transaction(async (manager) => {
      const task = await manager.findOne(Task, { where: { id: taskId } });
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
        authorUser = await manager.findOne(User, {
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
        authorAgent = await manager.findOne(AgentEntity, {
          where: { id: createCommentDto.authorAgentId },
        });
        if (!authorAgent) {
          throw new NotFoundException(
            `Agent with ID ${createCommentDto.authorAgentId} not found`,
          );
        }
      }

      const comment = manager.create(TaskComment, {
        content: createCommentDto.content,
        task,
        authorType,
        authorUser,
        authorAgent,
      });

      const savedComment = await manager.save(comment);
      // Reload within transaction to get full relations if needed,
      // though findOne below will do it outside. But let's keep it consistent.
      return manager.findOne(TaskComment, {
        where: { id: savedComment.id },
        relations: ['authorUser', 'authorAgent'],
      });
    });
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
    const artifactsToDelete = await this.commentsRepository.manager.transaction(
      async (manager) => {
        const where: FindOptionsWhere<TaskComment> = { id };
        if (taskId) {
          where.task = { id: taskId };
        }
        const comment = await manager.findOne(TaskComment, { where });
        if (!comment) {
          throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        const artifacts = comment.artifacts || [];
        await manager.remove(comment);
        return artifacts;
      },
    );

    // Delete associated artifacts from disk AFTER successful DB removal
    if (artifactsToDelete.length > 0) {
      for (const artifact of artifactsToDelete) {
        try {
          await this.storageService.delete(artifact.filePath);
        } catch (error) {
          this.logger.error(
            `Failed to delete artifact file ${artifact.filePath}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    }
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    taskId?: string,
  ) {
    return this.commentsRepository.manager.transaction(async (manager) => {
      const where: FindOptionsWhere<TaskComment> = { id };
      if (taskId) {
        where.task = { id: taskId };
      }
      const comment = await manager.findOne(TaskComment, {
        where,
        relations: ['authorUser', 'authorAgent'],
      });
      if (!comment) {
        throw new NotFoundException(`Comment with ID ${id} not found`);
      }

      if (updateCommentDto.content !== undefined) {
        comment.content = updateCommentDto.content;
      }

      return manager.save(comment);
    });
  }
}
