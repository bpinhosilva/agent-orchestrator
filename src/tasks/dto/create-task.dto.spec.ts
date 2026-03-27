import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

describe('CreateTaskDto', () => {
  let dto: CreateTaskDto;

  beforeEach(() => {
    dto = new CreateTaskDto();
    dto.title = 'Test Task';
    dto.description = 'Test Description';
    dto.projectId = '550e8400-e29b-41d4-a716-446655440000'; // Valid UUID
  });

  it('should be valid with all fields', async () => {
    dto.status = TaskStatus.BACKLOG;
    dto.priority = TaskPriority.MEDIUM;
    dto.assigneeId = '550e8400-e29b-41d4-a716-446655440001';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid without assigneeId', async () => {
    // assigneeId is missing
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid with null assigneeId', async () => {
    dto.assigneeId = null;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with invalid UUID for assigneeId', async () => {
    dto.assigneeId = 'invalid-uuid';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should be invalid without title', async () => {
    Object.assign(dto, { title: undefined });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should be invalid without description', async () => {
    Object.assign(dto, { description: undefined });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should be invalid without projectId', async () => {
    Object.assign(dto, { projectId: undefined });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
