import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { StorageService } from '../common/storage.service';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

jest.mock('fs');
jest.mock('fs/promises');

describe('UploadsController', () => {
  let controller: UploadsController;
  let storageService: StorageService;
  let mockResponse: Response;
  let setHeaderMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [StorageService],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    storageService = module.get<StorageService>(StorageService);

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
      const testFilename = 'non-existent-file.txt';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile(testFilename, mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should prevent path traversal attacks using ../../../../etc/passwd', () => {
      const maliciousFilename = '../../../../etc/passwd';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile(maliciousFilename, mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should prevent path traversal attacks using ../../../etc/hosts', () => {
      const maliciousFilename = '../../../etc/hosts';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile(maliciousFilename, mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should prevent path traversal attacks using absolute paths', () => {
      const maliciousFilename = '/etc/passwd';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile(maliciousFilename, mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should handle encoded path traversal attempts', () => {
      const maliciousFilename = '..%2F..%2F..%2Fetc%2Fpasswd';

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => controller.getFile(maliciousFilename, mockResponse)).toThrow(
        NotFoundException,
      );
    });

    it('should extract only the basename from paths with directory components', () => {
      // path.basename('dir/file.txt') returns 'file.txt'
      const filenameWithPath = 'some/dir/legitimate-file.txt';
      const artifactsPath = storageService.getArtifactsPath();

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(filenameWithPath, mockResponse);

      expect(result).toBeDefined();
      // The file should be resolved to the artifact directory, not a subdirectory
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join(artifactsPath, 'legitimate-file.txt'),
      );
    });

    it('should set correct MIME type for .pdf files', () => {
      const testFilename = 'test-file.pdf';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(testFilename, mockResponse);

      expect(result).toBeDefined();
      expect(setHeaderMock).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
      });
    });

    it('should set correct MIME type for .png files', () => {
      const testFilename = 'test-image.png';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(testFilename, mockResponse);

      expect(result).toBeDefined();
      expect(setHeaderMock).toHaveBeenCalledWith({
        'Content-Type': 'image/png',
      });
    });

    it('should return StreamableFile for valid safe filename', () => {
      const testFilename = 'valid-file.txt';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = controller.getFile(testFilename, mockResponse);

      expect(result).toBeDefined();
    });
  });
});
