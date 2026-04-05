import { validate } from 'class-validator';
import { CreateAgentDto } from './create-agent.dto';

describe('CreateAgentDto', () => {
  let dto: CreateAgentDto;

  beforeEach(() => {
    dto = new CreateAgentDto();
    dto.name = 'Research Node';
    dto.role = 'Researcher';
    dto.modelId = 'model-123';
    dto.providerId = '550e8400-e29b-41d4-a716-446655440000';
  });

  it('should be valid with a supported emoji', async () => {
    dto.emoji = '🧠';

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should be invalid with an unsupported emoji', async () => {
    dto.emoji = '😀' as CreateAgentDto['emoji'];

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
