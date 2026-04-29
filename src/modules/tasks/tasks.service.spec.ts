import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return empty array', async () => {
      const tasks = await service.getTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('should return count 0 and ISO timestamp', async () => {
      const result = await service.refresh();

      expect(result.count).toBe(0);
      expect(result.refreshedAt).toBeDefined();
      expect(() => new Date(result.refreshedAt)).not.toThrow();
    });
  });
});
