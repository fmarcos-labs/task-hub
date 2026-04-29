import { Test, TestingModule } from '@nestjs/testing';
import { TasksCacheService } from './tasks-cache.service';
import { UnifiedTaskDto, TaskSource, TaskPriority } from '../dto';
import { RemindersSource } from '../sources/reminders/reminders.source';
import { TodoistSource } from '../sources/todoist/todoist.source';

describe('TasksCacheService', () => {
  let service: TasksCacheService;
  let mockReminders: jest.Mocked<RemindersSource>;
  let mockTodoist: jest.Mocked<TodoistSource>;

  const createMockTask = (id: string, source: TaskSource): UnifiedTaskDto => ({
    id,
    title: `Task ${id}`,
    source,
    priority: TaskPriority.NONE,
    completed: false,
  });

  beforeEach(async () => {
    mockReminders = {
      name: TaskSource.REMINDERS,
      fetch: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<RemindersSource>;

    mockTodoist = {
      name: TaskSource.TODOIST,
      fetch: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<TodoistSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksCacheService,
        { provide: RemindersSource, useValue: mockReminders },
        { provide: TodoistSource, useValue: mockTodoist },
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

      mockReminders.fetch.mockResolvedValue([mockTasks[0]]);
      mockTodoist.fetch.mockResolvedValue([mockTasks[1]]);

      await service.refresh();

      const tasks = service.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('rem-1');
      expect(tasks[1].id).toBe('tdo-1');
    });
  });

  describe('refresh', () => {
    it('should fetch from all sources and merge', async () => {
      mockReminders.fetch.mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      mockTodoist.fetch.mockResolvedValue([
        createMockTask('tdo-1', TaskSource.TODOIST),
      ]);

      const result = await service.refresh();

      expect(result.count).toBe(2);
      expect(result.refreshedAt).toBeDefined();
    });

    it('should not break if one source fails', async () => {
      mockReminders.fetch.mockRejectedValue(new Error('Source failed'));
      mockTodoist.fetch.mockResolvedValue([
        createMockTask('tdo-1', TaskSource.TODOIST),
      ]);

      const result = await service.refresh();

      expect(result.count).toBe(1);
      expect(result.refreshedAt).toBeDefined();
    });

    it('should deduplicate concurrent refreshes', async () => {
      mockReminders.fetch.mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      mockTodoist.fetch.mockResolvedValue([]);

      const [result1, result2] = await Promise.all([
        service.refresh(),
        service.refresh(),
      ]);

      expect(mockReminders.fetch).toHaveBeenCalledTimes(1);
      expect(result1.count).toBe(1);
      expect(result2.count).toBe(1);
    });
  });

  describe('getLastRefreshAt', () => {
    it('should return null before first refresh', () => {
      expect(service.getLastRefreshAt()).toBeNull();
    });

    it('should return ISO string after refresh', async () => {
      mockReminders.fetch.mockResolvedValue([
        createMockTask('rem-1', TaskSource.REMINDERS),
      ]);
      mockTodoist.fetch.mockResolvedValue([]);

      await service.refresh();

      const lastRefresh = service.getLastRefreshAt();
      expect(lastRefresh).not.toBeNull();
      expect(() => new Date(lastRefresh!)).not.toThrow();
    });
  });
});
