import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { AgentRequestDto } from './dto/agent-request.dto';
import { AgentResponse } from './interfaces/agent.interface';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AgentEntity } from './entities/agent.entity';

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
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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
      const dto: AgentRequestDto = { agentId: 'agent-1', input: 'hello AI' };
      const expectedResponse: AgentResponse = { content: 'hello human' };
      const processRequestSpy = jest
        .spyOn(service, 'processRequest')
        .mockResolvedValue(expectedResponse);
      expect(await controller.processText(dto)).toBe(expectedResponse);
      expect(processRequestSpy).toHaveBeenCalledWith('agent-1', 'hello AI');
    });
  });

  describe('CRUD operations', () => {
    const mockAgent = {
      id: 'uuid-123',
      name: 'Agent Smith',
      description: 'Test Description',
      systemInstructions: 'Test Instructions',
      model: { id: 'model-123', name: 'gpt-4' },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as AgentEntity;

    it('should create an agent', async () => {
      const dto: CreateAgentDto = {
        name: 'Agent Smith',
        description: 'Test Description',
        systemInstructions: 'Test Instructions',
        modelId: 'model-123',
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockAgent);
      expect(await controller.create(dto)).toBe(mockAgent);
    });

    it('should find all agents', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockAgent]);
      expect(await controller.findAll()).toEqual([mockAgent]);
    });

    it('should find one agent', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAgent);
      expect(await controller.findOne('uuid-123')).toBe(mockAgent);
    });

    it('should update an agent', async () => {
      const dto: UpdateAgentDto = { name: 'Updated Agent' };
      jest.spyOn(service, 'update').mockResolvedValue({ ...mockAgent, ...dto });
      expect(await controller.update('uuid-123', dto)).toEqual({
        ...mockAgent,
        ...dto,
      });
    });

    it('should delete an agent', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);
      expect(await controller.remove('uuid-123')).toBeUndefined();
    });
  });
});
