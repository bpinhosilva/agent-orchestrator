import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { GeminiAgent } from './implementations/gemini.agent';

describe('AgentsService', () => {
  let service: AgentsService;
  let geminiAgent: GeminiAgent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: GeminiAgent,
          useValue: {
            getName: jest.fn().mockReturnValue('MockedGeminiAgent'),
            processText: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    geminiAgent = module.get<GeminiAgent>(GeminiAgent);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processRequest', () => {
    it('should delegate processText to the default agent', async () => {
      const expectedResponse = { content: 'test response' };
      jest.spyOn(geminiAgent, 'processText').mockResolvedValue(expectedResponse);

      const result = await service.processRequest({ input: 'test input' });

      expect(geminiAgent.processText).toHaveBeenCalledWith('test input');
      expect(result).toBe(expectedResponse);
    });
  });
});
