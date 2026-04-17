import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { TaskComment, CommentAuthorType } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { StorageService } from '../common/storage.service';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let mockCommentsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    manager: { transaction: jest.Mock };
  };
  let mockStorageService: { delete: jest.Mock };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockCommentsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      manager: {
        transaction: jest
          .fn()
          .mockImplementation((cb: (manager: typeof mockManager) => unknown) =>
            cb(mockManager),
          ),
      },
    };

    mockStorageService = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(TaskComment),
          useValue: mockCommentsRepository,
        },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const taskId = 'task-uuid';
    const task = { id: taskId };
    const savedComment = { id: 'comment-uuid', content: 'Hello' };

    it('should create a comment with a user author', async () => {
      const user = { id: 'user-uuid' };
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(savedComment);
      mockManager.create.mockReturnValue({ content: 'Hello' });
      mockManager.save.mockResolvedValue(savedComment);

      const result = await service.create(taskId, {
        content: 'Hello',
        authorUserId: 'user-uuid',
      });

      expect(result).toEqual(savedComment);
      expect(mockManager.create).toHaveBeenCalledWith(
        TaskComment,
        expect.objectContaining({
          authorType: CommentAuthorType.USER,
          authorUser: user,
          authorAgent: null,
        }),
      );
    });

    it('should create a comment with an agent author', async () => {
      const agent = { id: 'agent-uuid' };
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(agent)
        .mockResolvedValueOnce(savedComment);
      mockManager.create.mockReturnValue({ content: 'Hello' });
      mockManager.save.mockResolvedValue(savedComment);

      const result = await service.create(taskId, {
        content: 'Hello',
        authorAgentId: 'agent-uuid',
      });

      expect(result).toEqual(savedComment);
      expect(mockManager.create).toHaveBeenCalledWith(
        TaskComment,
        expect.objectContaining({
          authorType: CommentAuthorType.AGENT,
          authorAgent: agent,
          authorUser: null,
        }),
      );
    });

    it('should infer USER authorType from authorUserId when authorType not provided', async () => {
      const user = { id: 'user-uuid' };
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(savedComment);
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue(savedComment);

      await service.create(taskId, {
        content: 'Hi',
        authorUserId: 'user-uuid',
      });

      expect(mockManager.create).toHaveBeenCalledWith(
        TaskComment,
        expect.objectContaining({ authorType: CommentAuthorType.USER }),
      );
    });

    it('should infer AGENT authorType from authorAgentId when authorType not provided', async () => {
      const agent = { id: 'agent-uuid' };
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(agent)
        .mockResolvedValueOnce(savedComment);
      mockManager.create.mockReturnValue({});
      mockManager.save.mockResolvedValue(savedComment);

      await service.create(taskId, {
        content: 'Hi',
        authorAgentId: 'agent-uuid',
      });

      expect(mockManager.create).toHaveBeenCalledWith(
        TaskComment,
        expect.objectContaining({ authorType: CommentAuthorType.AGENT }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create(taskId, { content: 'Hi', authorUserId: 'user-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when neither authorUserId nor authorAgentId is provided', async () => {
      mockManager.findOne.mockResolvedValueOnce(task);

      await expect(
        service.create(taskId, {
          content: 'Hi',
        } as unknown as CreateCommentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when authorUser not found', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(null);

      await expect(
        service.create(taskId, {
          content: 'Hi',
          authorUserId: 'missing-user',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when authorAgent not found', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(null);

      await expect(
        service.create(taskId, {
          content: 'Hi',
          authorAgentId: 'missing-agent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByTask', () => {
    it('should return all comments for a task ordered by createdAt ASC', async () => {
      const comments = [{ id: '1' }, { id: '2' }];
      mockCommentsRepository.find.mockResolvedValue(comments);

      const result = await service.findAllByTask('task-uuid');

      expect(result).toEqual(comments);
      expect(mockCommentsRepository.find).toHaveBeenCalledWith({
        where: { task: { id: 'task-uuid' } },
        relations: ['authorUser', 'authorAgent'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      const comment = { id: 'comment-uuid' };
      mockCommentsRepository.findOne.mockResolvedValue(comment);

      const result = await service.findOne('comment-uuid');

      expect(result).toEqual(comment);
      expect(mockCommentsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'comment-uuid' } }),
      );
    });

    it('should include taskId in the where clause when provided', async () => {
      const comment = { id: 'comment-uuid' };
      mockCommentsRepository.findOne.mockResolvedValue(comment);

      await service.findOne('comment-uuid', 'task-uuid');

      expect(mockCommentsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comment-uuid', task: { id: 'task-uuid' } },
        }),
      );
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when comment belongs to a different task', async () => {
      mockCommentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('comment-uuid', 'wrong-task'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a comment with no artifacts', async () => {
      const comment = { id: 'comment-uuid', artifacts: [] };
      mockManager.findOne.mockResolvedValue(comment);
      mockManager.remove.mockResolvedValue(undefined);

      await service.remove('comment-uuid');

      expect(mockManager.remove).toHaveBeenCalledWith(comment);
      expect(mockStorageService.delete).not.toHaveBeenCalled();
    });

    it('should remove comment and delete all artifact files after commit', async () => {
      const comment = {
        id: 'comment-uuid',
        artifacts: [
          { filePath: 'path/to/file1.png' },
          { filePath: 'path/to/file2.png' },
        ],
      };
      mockManager.findOne.mockResolvedValue(comment);
      mockManager.remove.mockResolvedValue(undefined);

      await service.remove('comment-uuid');

      expect(mockStorageService.delete).toHaveBeenCalledTimes(2);
      expect(mockStorageService.delete).toHaveBeenCalledWith(
        'path/to/file1.png',
      );
      expect(mockStorageService.delete).toHaveBeenCalledWith(
        'path/to/file2.png',
      );
    });

    it('should log error but not throw when artifact deletion fails', async () => {
      const comment = {
        id: 'comment-uuid',
        artifacts: [{ filePath: 'bad/path.png' }],
      };
      mockManager.findOne.mockResolvedValue(comment);
      mockManager.remove.mockResolvedValue(undefined);
      mockStorageService.delete.mockRejectedValue(new Error('storage error'));

      await expect(service.remove('comment-uuid')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update comment content', async () => {
      const comment = { id: 'comment-uuid', content: 'Old' };
      const updated = { ...comment, content: 'New' };
      mockManager.findOne.mockResolvedValue(comment);
      mockManager.save.mockResolvedValue(updated);

      const result = await service.update('comment-uuid', { content: 'New' });

      expect(result).toEqual(updated);
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'New' }),
      );
    });

    it('should not mutate content when dto.content is undefined', async () => {
      const comment = { id: 'comment-uuid', content: 'Original' };
      mockManager.findOne.mockResolvedValue(comment);
      mockManager.save.mockResolvedValue(comment);

      await service.update('comment-uuid', {});

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Original' }),
      );
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply taskId scoping when provided', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(
        service.update('comment-uuid', { content: 'x' }, 'task-uuid'),
      ).rejects.toThrow(NotFoundException);

      expect(mockManager.findOne).toHaveBeenCalledWith(
        TaskComment,
        expect.objectContaining({
          where: expect.objectContaining({
            task: { id: 'task-uuid' },
          }) as unknown,
        }),
      );
    });
  });
});
