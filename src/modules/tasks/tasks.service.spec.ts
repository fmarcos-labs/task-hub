import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksCacheService } from './cache/tasks-cache.service';
import { TaskSource, TaskPriority } from './dto';

describe('TasksService', () => {
  let service: TasksService;
  let cache: TasksCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksCacheService,
          useValue: {
            getAll: jest.fn().mockReturnValue([]),
            refresh: jest.fn().mockResolvedValue({
              count: 0,
              refreshedAt: new Date().toISOString(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    cache = module.get<TasksCacheService>(TasksCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return tasks from cache', async () => {
      const mockTasks = [
        {
          id: 'rem-123',
          title: 'Task 1',
          source: TaskSource.REMINDERS,
          priority: TaskPriority.NONE,
          completed: false,
        },
      ];
      (cache.getAll as jest.Mock).mockReturnValue(mockTasks);

      const tasks = await service.getTasks();

      expect(tasks).toEqual(mockTasks);
      expect(cache.getAll).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should call cache refresh', async () => {
      const result = await service.refresh();

      expect(cache.refresh).toHaveBeenCalled();
      expect(result.count).toBeDefined();
      expect(result.refreshedAt).toBeDefined();
    });
  });
});
