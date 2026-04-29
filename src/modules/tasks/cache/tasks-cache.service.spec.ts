import { Test, TestingModule } from '@nestjs/testing';
import { TasksCacheService, TASK_SOURCES } from './tasks-cache.service';
import { UnifiedTaskDto, TaskSource, TaskPriority } from '../dto';
import type { ITaskSource } from '../sources/task-source.interface';

describe('TasksCacheService', () => {
  let service: TasksCacheService;
  let mockSources: ITaskSource[];

  const createMockTask = (id: string, source: TaskSource): UnifiedTaskDto => ({
    id,
    title: `Task ${id}`,
    source,
    priority: TaskPriority.NONE,
    completed: false,
  });

  beforeEach(async () => {
    mockSources = [
      { name: TaskSource.REMINDERS, fetch: jest.fn().mockResolvedValue([]) },
      { name: TaskSource.TODOIST, fetch: jest.fn().mockResolvedValue([]) },
    ] as ITaskSource[];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksCacheService,
        { provide: TASK_SOURCES, useValue: mockSources },
      ],
    }).compile();

    service = module.get<TasksCacheService>(TasksCacheService);
  });

  describe('getAll', () => {
    it('should return empty array before first refresh', () => {
      const tasks = service.getAll();
      expect(tasks).toEqual([]);
    });

    it('should return cached tasks after refresh', async () => {
      const mockTasks = [
        createMockTask('rem-1', TaskSource.REMINDERS),
        createMockTask('tdo-1', TaskSource.TODOIST),
      ];

      (mockSources[0].fetch as jest.Mock).mockResolvedValue([mockTasks[0]]);
      (mockSources[1].fetch as jest.Mock).mockResolvedValue([mockTasks[1]]);

      await service.refresh();

      const tasks = service.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('rem-1');
      expect(tasks[1].id).toBe('tdo-1');
    });
  });

  describe('refresh', () => {
    it('should fetch from all sources and merge', async () => {
      (mockSources[0].fetch as jest.Mock).mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      (mockSources[1].fetch as jest.Mock).mockResolvedValue([
        createMockTask('tdo-1', TaskSource.TODOIST),
      ]);

      const result = await service.refresh();

      expect(result.count).toBe(2);
      expect(result.refreshedAt).toBeDefined();
    });

    it('should not break if one source fails', async () => {
      (mockSources[0].fetch as jest.Mock).mockRejectedValue(
        new Error('Source failed'),
      );
      (mockSources[1].fetch as jest.Mock).mockResolvedValue([
        createMockTask('tdo-1', TaskSource.TODOIST),
      ]);

      const result = await service.refresh();

      expect(result.count).toBe(1);
      expect(result.refreshedAt).toBeDefined();
    });

    it('should deduplicate concurrent refreshes', async () => {
      (mockSources[0].fetch as jest.Mock).mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      (mockSources[1].fetch as jest.Mock).mockResolvedValue([]);

      const [result1, result2] = await Promise.all([
        service.refresh(),
        service.refresh(),
      ]);

      expect(mockSources[0].fetch).toHaveBeenCalledTimes(1);
      expect(result1.count).toBe(1);
      expect(result2.count).toBe(1);
    });
  });

  describe('getLastRefreshAt', () => {
    it('should return null before first refresh', () => {
      expect(service.getLastRefreshAt()).toBeNull();
    });

    it('should return ISO string after refresh', async () => {
      (mockSources[0].fetch as jest.Mock).mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      (mockSources[1].fetch as jest.Mock).mockResolvedValue([]);

      await service.refresh();

      const lastRefresh = service.getLastRefreshAt();
      expect(lastRefresh).not.toBeNull();
      expect(() => new Date(lastRefresh!)).not.toThrow();
    });
  });
});
