import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { RemindersSource } from './sources/reminders/reminders.source';
import { TaskSource } from './dto/index';

describe('TasksService', () => {
  let service: TasksService;
  let remindersSource: RemindersSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: RemindersSource,
          useValue: {
            fetch: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    remindersSource = module.get<RemindersSource>(RemindersSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return empty array when reminders source returns empty', async () => {
      const tasks = await service.getTasks();
      expect(tasks).toEqual([]);
      expect(remindersSource.fetch).toHaveBeenCalled();
    });

    it('should return tasks from reminders source', async () => {
      const mockTask = {
        id: 'rem-123',
        title: 'Test task',
        source: TaskSource.REMINDERS,
        priority: 'none' as const,
        completed: false,
      };
      (remindersSource.fetch as jest.Mock).mockResolvedValue([mockTask]);

      const tasks = await service.getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('rem-123');
    });
  });

  describe('refresh', () => {
    it('should return count 0 and ISO timestamp', async () => {
      const result = await service.refresh();

      expect(result.count).toBe(0);
      expect(result.refreshedAt).toBeDefined();
      expect(() => new Date(result.refreshedAt)).not.toThrow();
    });

    it('should return count from tasks', async () => {
      const mockTask = {
        id: 'rem-123',
        title: 'Test task',
        source: TaskSource.REMINDERS,
        priority: 'none' as const,
        completed: false,
      };
      (remindersSource.fetch as jest.Mock).mockResolvedValue([mockTask]);

      const result = await service.refresh();

      expect(result.count).toBe(1);
    });
  });
});
