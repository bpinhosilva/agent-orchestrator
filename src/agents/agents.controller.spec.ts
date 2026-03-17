import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentRequestDto } from './dto/agent-request.dto';
import { AgentResponse } from './interfaces/agent.interface';

describe('AgentsController', () => {
  let controller: AgentsController;
  let service: AgentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: {
            processRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    service = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processText', () => {
    it('should call service with the correctly validated dto', async () => {
      const dto: AgentRequestDto = { input: 'hello AI' };
      const expectedResponse: AgentResponse = { content: 'hello human' };
      const processRequestSpy = jest
        .spyOn(service, 'processRequest')
        .mockResolvedValue(expectedResponse);

      const result = await controller.processText(dto);

      expect(processRequestSpy).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResponse);
    });
  });
});
