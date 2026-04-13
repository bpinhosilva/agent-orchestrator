import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAgentDto } from './create-agent.dto';
import { AgentAttributesDto } from './agent-attributes.dto';

describe('CreateAgentDto', () => {
  let dto: CreateAgentDto;

  beforeEach(() => {
    dto = new CreateAgentDto();
    dto.name = 'Research Node';
    dto.role = 'Researcher';
    dto.modelId = 'model-123';
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

  describe('attributes', () => {
    it('should be valid without attributes (optional)', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with balanced attributes', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 3.0,
        strictness: 3.5,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should be valid with boundary values (min=1, max=5)', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 1.0,
        strictness: 5.0,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should be valid with 2 decimal places', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 2.75,
        strictness: 4.33,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should be invalid when creativity is below minimum (< 1)', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 0.5,
        strictness: 3.5,
      });

      const errors = await validate(dto, { whitelist: true });

      const attributeErrors = errors.find((e) => e.property === 'attributes');
      expect(attributeErrors).toBeDefined();
    });

    it('should be invalid when strictness exceeds maximum (> 5)', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 3.0,
        strictness: 5.5,
      });

      const errors = await validate(dto, { whitelist: true });

      const attributeErrors = errors.find((e) => e.property === 'attributes');
      expect(attributeErrors).toBeDefined();
    });

    it('should be invalid with more than 2 decimal places', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 3.001,
        strictness: 3.5,
      });

      const errors = await validate(dto, { whitelist: true });

      const attributeErrors = errors.find((e) => e.property === 'attributes');
      expect(attributeErrors).toBeDefined();
    });

    it('should be valid with only creativity provided (strictness optional)', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        creativity: 3.0,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should be valid with only strictness provided (creativity optional)', async () => {
      dto.attributes = plainToInstance(AgentAttributesDto, {
        strictness: 3.5,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});

describe('AgentAttributesDto', () => {
  it('should be valid with creativity and strictness in range', async () => {
    const dto = plainToInstance(AgentAttributesDto, {
      creativity: 3.0,
      strictness: 3.5,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should be invalid when creativity is 0', async () => {
    const dto = plainToInstance(AgentAttributesDto, { creativity: 0 });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'creativity')).toBe(true);
  });

  it('should be invalid when strictness is 6', async () => {
    const dto = plainToInstance(AgentAttributesDto, { strictness: 6 });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'strictness')).toBe(true);
  });

  it('should be invalid when creativity has 3 decimal places', async () => {
    const dto = plainToInstance(AgentAttributesDto, { creativity: 1.123 });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'creativity')).toBe(true);
  });
});
