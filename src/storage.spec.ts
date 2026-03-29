import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './common/storage.service';
import * as path from 'path';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should return correct base path', () => {
    const expected = path.join(
      process.env.AGENT_ORCHESTRATOR_HOME ||
        path.join(process.cwd(), '.agent-orchestrator'),
      'artifacts',
    );
    expect(service.getArtifactsPath()).toBe(expected);
  });
});
