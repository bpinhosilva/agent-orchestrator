import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileSystemStorageService } from './filesystem-storage.service';
import * as path from 'path';
import * as fs from 'fs';
import { writeFile, unlink } from 'fs/promises';

jest.mock('fs');
jest.mock('fs/promises');

describe('FileSystemStorageService', () => {
  let service: FileSystemStorageService;

  const baseDir =
    process.env.AGENT_ORCHESTRATOR_HOME ||
    path.join(process.cwd(), '.agent-orchestrator');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemStorageService],
    }).compile();

    service = module.get<FileSystemStorageService>(FileSystemStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getBucketPath / getFullPath
  // ---------------------------------------------------------------------------

  describe('getBucketPath', () => {
    it('should return baseDir joined with the bucket name', () => {
      expect(service.getBucketPath('artifacts')).toBe(
        path.join(baseDir, 'artifacts'),
      );
    });

    it('should support custom bucket names', () => {
      expect(service.getBucketPath('uploads')).toBe(
        path.join(baseDir, 'uploads'),
      );
    });
  });

  describe('getFullPath', () => {
    it('should join bucket path with the relative path', () => {
      const rel = '2024/01/15/tasks/task-id/uuid.png';
      expect(service.getFullPath(rel)).toBe(
        path.join(service.getBucketPath('artifacts'), rel),
      );
    });

    it('should use the supplied bucket', () => {
      const rel = '2024/01/15/tasks/some-id/file.pdf';
      expect(service.getFullPath(rel, 'custom')).toBe(
        path.join(service.getBucketPath('custom'), rel),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // save — caller supplies the full filePath
  // ---------------------------------------------------------------------------

  describe('save', () => {
    const validBuffer = Buffer.from('test content');
    const filePath = '2024/01/15/tasks/task-abc/uuid.png';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.mocked(writeFile).mockResolvedValue(undefined);
    });

    it('should write the buffer to the correct filesystem path', async () => {
      await service.save(validBuffer, 'image/png', filePath);

      const expectedFsPath = path.join(
        service.getBucketPath('artifacts'),
        filePath,
      );
      expect(writeFile).toHaveBeenCalledWith(expectedFsPath, validBuffer);
    });

    it('should return void', async () => {
      const result = await service.save(validBuffer, 'image/png', filePath);

      expect(result).toBeUndefined();
    });

    it('should reject a disallowed MIME type', async () => {
      await expect(
        service.save(validBuffer, 'application/exe', filePath),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a file exceeding 10 MB', async () => {
      const bigBuffer = Buffer.alloc(11 * 1024 * 1024);
      await expect(
        service.save(bigBuffer, 'image/png', filePath),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject a filePath containing ..', async () => {
      await expect(
        service.save(validBuffer, 'image/png', '../../etc/passwd'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject an absolute filePath', async () => {
      await expect(
        service.save(validBuffer, 'image/png', '/etc/passwd'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept a custom bucket', async () => {
      await service.save(validBuffer, 'image/png', filePath, 'custom-bucket');

      const expectedFsPath = path.join(
        service.getBucketPath('custom-bucket'),
        filePath,
      );
      expect(writeFile).toHaveBeenCalledWith(expectedFsPath, validBuffer);
    });
  });

  // ---------------------------------------------------------------------------
  // saveBase64
  // ---------------------------------------------------------------------------

  describe('saveBase64', () => {
    const filePath = '2024/01/15/tasks/task-abc/uuid.txt';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.mocked(writeFile).mockResolvedValue(undefined);
    });

    it('should decode base64 and write the buffer', async () => {
      const content = 'hello world';
      const b64 = Buffer.from(content).toString('base64');

      await service.saveBase64(b64, 'text/plain', filePath);

      expect(writeFile).toHaveBeenCalledTimes(1);
      const [, writtenBuffer] = jest.mocked(writeFile).mock.calls[0];
      expect((writtenBuffer as Buffer).toString()).toBe(content);
    });

    it('should return void', async () => {
      const b64 = Buffer.from('data').toString('base64');
      const result = await service.saveBase64(b64, 'text/plain', filePath);

      expect(result).toBeUndefined();
    });

    it('should reject a disallowed MIME type before decoding', async () => {
      await expect(
        service.saveBase64('abc', 'application/exe', filePath),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it('should delete a file that exists', async () => {
      const relativePath = '2024/01/15/tasks/task-abc/uuid.png';
      const fullPath = service.getFullPath(relativePath);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.mocked(unlink).mockResolvedValue(undefined);

      await service.delete(relativePath);

      expect(unlink).toHaveBeenCalledWith(fullPath);
    });

    it('should not throw when the file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        service.delete('2024/01/15/tasks/task-abc/uuid.png'),
      ).resolves.not.toThrow();
    });

    it('should normalise legacy paths (uploads/artifacts/uuid.ext)', async () => {
      const legacyPath = 'uploads/artifacts/old-uuid.png';
      const expectedPath = service.getFullPath('old-uuid.png');

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      jest.mocked(unlink).mockResolvedValue(undefined);

      await service.delete(legacyPath);

      expect(unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should reject a relativePath containing ..', async () => {
      await expect(service.delete('../../etc/passwd')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
