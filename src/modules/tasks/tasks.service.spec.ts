import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { RemindersSource } from './sources/reminders/reminders.source';
import { TodoistSource } from './sources/todoist/todoist.source';
import { TaskSource } from './dto/index';

describe('TasksService', () => {
  let service: TasksService;
  let remindersSource: RemindersSource;
  let todoistSource: TodoistSource;

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
        {
          provide: TodoistSource,
          useValue: {
            fetch: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    remindersSource = module.get<RemindersSource>(RemindersSource);
    todoistSource = module.get<TodoistSource>(TodoistSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTasks', () => {
    it('should return empty array when both sources return empty', async () => {
      const tasks = await service.getTasks();
      expect(tasks).toEqual([]);
      expect(remindersSource.fetch).toHaveBeenCalled();
      expect(todoistSource.fetch).toHaveBeenCalled();
    });

    it('should return combined tasks from both sources', async () => {
      const reminderTask = {
        id: 'rem-123',
        title: 'Reminder task',
        source: TaskSource.REMINDERS,
        priority: 'none' as const,
        completed: false,
      };
      const todoistTask = {
        id: 'tdo-456',
        title: 'Todoist task',
        source: TaskSource.TODOIST,
        priority: 'none' as const,
        completed: false,
      };
      (remindersSource.fetch as jest.Mock).mockResolvedValue([reminderTask]);
      (todoistSource.fetch as jest.Mock).mockResolvedValue([todoistTask]);

      const tasks = await service.getTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('rem-123');
      expect(tasks[1].id).toBe('tdo-456');
    });
  });

  describe('refresh', () => {
    it('should return count 0 and ISO timestamp', async () => {
      const result = await service.refresh();

      expect(result.count).toBe(0);
      expect(result.refreshedAt).toBeDefined();
      expect(() => new Date(result.refreshedAt)).not.toThrow();
    });

    it('should return combined count from both sources', async () => {
      const reminderTask = {
        id: 'rem-1',
        title: 'R1',
        source: TaskSource.REMINDERS,
        priority: 'none' as const,
        completed: false,
      };
      const todoistTask = {
        id: 'tdo-1',
        title: 'T1',
        source: TaskSource.TODOIST,
        priority: 'none' as const,
        completed: false,
      };
      (remindersSource.fetch as jest.Mock).mockResolvedValue([reminderTask]);
      (todoistSource.fetch as jest.Mock).mockResolvedValue([todoistTask]);

      const result = await service.refresh();

      expect(result.count).toBe(2);
    });
  });
});
