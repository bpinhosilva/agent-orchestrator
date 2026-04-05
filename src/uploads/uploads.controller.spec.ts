import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { StorageService } from '../common/storage.service';
import { FileSystemStorageService } from '../common/filesystem-storage.service';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

jest.mock('fs');
jest.mock('fs/promises');

describe('UploadsController', () => {
  let controller: UploadsController;
  let storageService: FileSystemStorageService;
  let mockResponse: Response;
  let setHeaderMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: StorageService,
          useClass: FileSystemStorageService,
        },
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
    it('should throw NotFoundException when file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() =>
        controller.getFile('non-existent-file.txt', mockResponse),
      ).toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using ../../../../etc/passwd', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() =>
        controller.getFile('../../../../etc/passwd', mockResponse),
      ).toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using ../../../etc/hosts', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() =>
        controller.getFile('../../../etc/hosts', mockResponse),
      ).toThrow(NotFoundException);
    });

    it('should prevent path traversal attacks using absolute paths', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile('/etc/passwd', mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should handle encoded path traversal attempts', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() =>
        controller.getFile('..%2F..%2F..%2Fetc%2Fpasswd', mockResponse),
      ).toThrow(NotFoundException);
    });

    it('should prevent symlink escaping the bucket', () => {
      const hierarchicalPath = '2024/01/15/task-abc/uuid.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, hierarchicalPath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // realpathSync returns a path outside the bucket — simulates a symlink attack
      (fs.realpathSync as jest.Mock).mockReturnValue('/etc/passwd');

      expect(() => controller.getFile(hierarchicalPath, mockResponse)).toThrow(
        NotFoundException,
      );

      expect(fs.realpathSync).toHaveBeenCalledWith(nominalPath);
    });

    it('should serve files in sub-directories within the bucket', () => {
      const hierarchicalPath = '2024/01/15/task-abc/uuid.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, hierarchicalPath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(hierarchicalPath, mockResponse);

      expect(result).toBeDefined();
      expect(fs.existsSync).toHaveBeenCalledWith(nominalPath);
    });

    it('should set correct MIME type for .pdf files', () => {
      const filePath = '2024/01/15/id/test-file.pdf';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      controller.getFile(filePath, mockResponse);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/pdf' }),
      );
    });

    it('should set correct MIME type for .png files', () => {
      const filePath = '2024/01/15/id/test-image.png';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      controller.getFile(filePath, mockResponse);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'image/png' }),
      );
    });

    it('should always set X-Content-Type-Options: nosniff', () => {
      const filePath = '2024/01/15/id/file.bin';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      controller.getFile(filePath, mockResponse);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'X-Content-Type-Options': 'nosniff' }),
      );
    });

    it('should use application/octet-stream for unknown extensions', () => {
      const filePath = '2024/01/15/id/file.bin';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      controller.getFile(filePath, mockResponse);

      expect(setHeaderMock).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/octet-stream' }),
      );
    });

    it('should return StreamableFile for a valid flat filename', () => {
      const filePath = 'valid-file.txt';
      const bucketPath = storageService.getBucketPath('artifacts');
      const nominalPath = path.resolve(bucketPath, filePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.realpathSync as jest.Mock).mockReturnValue(nominalPath);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(filePath, mockResponse);

      expect(result).toBeDefined();
    });
  });
});
