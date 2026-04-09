import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { StorageService } from '../common/storage.service';
import { FileSystemStorageService } from '../common/filesystem-storage.service';
import * as path from 'path';
import * as fs from 'fs';
import type { Request, Response } from 'express';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { ParseFilePathPipe } from './parse-filepath.pipe';
import { User, UserRole } from '../users/entities/user.entity';

jest.mock('fs');
jest.mock('fs/promises');

/** Builds a minimal mock Express request for the uploads controller. */
function mockReq(filePath: string): Request {
  return {
    path: `/api/v1/uploads/artifacts/${filePath}`,
  } as unknown as Request;
}

describe('UploadsController', () => {
  let controller: UploadsController;
  let storageService: FileSystemStorageService;
  let mockResponse: Response;
  let setHeaderMock: jest.Mock;

  const mockAdminUser = {
    id: 'admin-id',
    role: UserRole.ADMIN,
  } as User;

  const mockProjectsService = {
    findOne: jest.fn(),
  };

  const mockTasksService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: StorageService,
          useClass: FileSystemStorageService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        ParseFilePathPipe,
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    storageService = module.get<FileSystemStorageService>(StorageService);

    setHeaderMock = jest.fn();
    mockResponse = {
      set: setHeaderMock,
    } as unknown as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFile', () => {
    it('should throw NotFoundException when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.getFile(
          mockReq('non-existent-file.txt'),
          mockResponse,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using ../../../../etc/passwd', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.getFile(
          mockReq('../../../../etc/passwd'),
          mockResponse,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using ../../../etc/hosts', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.getFile(
          mockReq('../../../etc/hosts'),
          mockResponse,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using absolute paths', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.getFile(mockReq('/etc/passwd'), mockResponse, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle encoded path traversal attempts', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.getFile(
          mockReq('..%2F..%2F..%2Fetc%2Fpasswd'),
          mockResponse,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent symlink escaping the bucket', async () => {
      const hierarchicalPath = '2024/01/15/tasks/task-abc/uuid.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, hierarchicalPath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // realpathSync returns a path outside the bucket — simulates a symlink attack
      (fs.realpathSync as jest.Mock).mockReturnValue('/etc/passwd');

      await expect(
        controller.getFile(
          mockReq(hierarchicalPath),
          mockResponse,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(fs.realpathSync).toHaveBeenCalledWith(nominalPath);
    });

    it('should serve files in sub-directories within the bucket', async () => {
      const hierarchicalPath = '2024/01/15/tasks/task-abc/uuid.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, hierarchicalPath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = await controller.getFile(
        mockReq(hierarchicalPath),
        mockResponse,
        mockAdminUser,
      );

      expect(result).toBeDefined();
      expect(fs.existsSync).toHaveBeenCalledWith(nominalPath);
    });

    it('should set correct MIME type for .pdf files', async () => {
      const filePath = '2024/01/15/tasks/id/test-file.pdf';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      await controller.getFile(mockReq(filePath), mockResponse, mockAdminUser);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/pdf' }),
      );
    });

    it('should set correct MIME type for .png files', async () => {
      const filePath = '2024/01/15/tasks/id/test-image.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      await controller.getFile(mockReq(filePath), mockResponse, mockAdminUser);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'image/png' }),
      );
    });

    it('should always set X-Content-Type-Options: nosniff', async () => {
      const filePath = '2024/01/15/tasks/id/file.bin';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      await controller.getFile(mockReq(filePath), mockResponse, mockAdminUser);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-Content-Type-Options': 'nosniff' }),
      );
    });

    it('should use application/octet-stream for unknown extensions', async () => {
      const filePath = '2024/01/15/tasks/id/file.bin';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      await controller.getFile(mockReq(filePath), mockResponse, mockAdminUser);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/octet-stream' }),
      );
    });

    it('should return StreamableFile for a valid flat filename', async () => {
      const filePath = 'valid-file.txt';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = await controller.getFile(
        mockReq(filePath),
        mockResponse,
        mockAdminUser,
      );

      expect(result).toBeDefined();
    });
  });
});
