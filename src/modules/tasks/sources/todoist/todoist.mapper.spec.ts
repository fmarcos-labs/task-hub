import { toUnifiedTask } from './todoist.mapper';
import { TaskSource, TaskPriority } from '../../dto/index';
import type { TodoistTask, TodoistProject } from './todoist.types';

describe('todoist.mapper', () => {
  describe('toUnifiedTask', () => {
    it('should map task with all fields', () => {
      const task: TodoistTask = {
        id: '123',
        content: 'Buy milk',
        description: '',
        project_id: 'proj-1',
        is_completed: false,
        priority: 3,
        due: {
          date: '2024-01-15',
          string: '15 Jan',
          timezone: null,
          is_recurring: false,
        },
        created_at: '2024-01-01T00:00:00Z',
      };
      const projects = new Map<string, TodoistProject>([
        [
          'proj-1',
          {
            id: 'proj-1',
            name: 'Groceries',
            color: 'red',
            is_shared: false,
            is_favorite: false,
          },
        ],
      ]);

      const result = toUnifiedTask(task, projects);

      expect(result.id).toBe('tdo-123');
      expect(result.title).toBe('Buy milk');
      expect(result.dueDate).toBe('2024-01-15');
      expect(result.source).toBe(TaskSource.TODOIST);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
      expect(result.list).toBe('Groceries');
      expect(result.completed).toBe(false);
    });

    it('should map priority 4 to HIGH', () => {
      const task: TodoistTask = {
        id: '1',
        content: 'High priority',
        description: '',
        project_id: 'proj-1',
        is_completed: false,
        priority: 4,
        due: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = toUnifiedTask(task, new Map());
      expect(result.priority).toBe(TaskPriority.HIGH);
    });

    it('should map priority 3 to MEDIUM', () => {
      const task: TodoistTask = {
        id: '2',
        content: 'Medium priority',
        description: '',
        project_id: 'proj-1',
        is_completed: false,
        priority: 3,
        due: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = toUnifiedTask(task, new Map());
      expect(result.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should map priority 2 to LOW', () => {
      const task: TodoistTask = {
        id: '3',
        content: 'Low priority',
        description: '',
        project_id: 'proj-1',
        is_completed: false,
        priority: 2,
        due: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = toUnifiedTask(task, new Map());
      expect(result.priority).toBe(TaskPriority.LOW);
    });

    it('should map priority 1 to NONE', () => {
      const task: TodoistTask = {
        id: '4',
        content: 'No priority',
        description: '',
        project_id: 'proj-1',
        is_completed: false,
        priority: 1,
        due: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = toUnifiedTask(task, new Map());
      expect(result.priority).toBe(TaskPriority.NONE);
    });

    it('should handle missing due and project', () => {
      const task: TodoistTask = {
        id: '5',
        content: 'Minimal task',
        description: '',
        project_id: 'proj-1',
        is_completed: true,
        priority: 1,
        due: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const result = toUnifiedTask(task, new Map());

      expect(result.dueDate).toBeUndefined();
      expect(result.list).toBeUndefined();
      expect(result.completed).toBe(true);
    });
  });
});
