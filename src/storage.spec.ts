import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemStorageService } from './common/filesystem-storage.service';
import * as path from 'path';

describe('FileSystemStorageService', () => {
  let service: FileSystemStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSystemStorageService],
    }).compile();

    service = module.get<FileSystemStorageService>(FileSystemStorageService);
  });

  it('should return correct bucket path for artifacts', () => {
    const expected = path.join(
      process.env.AGENT_ORCHESTRATOR_HOME ||
        path.join(process.cwd(), '.agent-orchestrator'),
      'artifacts',
    );
    expect(service.getBucketPath('artifacts')).toBe(expected);
  });

  it('should return the full filesystem path for a bucket-relative path', () => {
    const relative = '2024/01/15/task-abc/uuid.png';
    const expected = path.join(service.getBucketPath('artifacts'), relative);
    expect(service.getFullPath(relative)).toBe(expected);
  });

  it('should use the supplied bucket in getFullPath', () => {
    const relative = '2024/01/15/some-id/file.pdf';
    const expected = path.join(service.getBucketPath('custom'), relative);
    expect(service.getFullPath(relative, 'custom')).toBe(expected);
  });
});
