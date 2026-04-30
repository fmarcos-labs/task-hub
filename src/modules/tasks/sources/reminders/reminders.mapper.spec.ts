import { toUnifiedTask } from './reminders.mapper';
import { TaskSource, TaskPriority } from '../../dto/index';
import type { RemindctlReminder } from './remindctl.runner';

describe('reminders.mapper', () => {
  describe('toUnifiedTask', () => {
    it('should map reminder with all fields', () => {
      const reminder: RemindctlReminder = {
        id: 'abc-123',
        title: 'Buy milk',
        dueDate: '2024-01-15T10:00:00Z',
        isCompleted: false,
        priority: 'medium',
        listID: 'list-1',
        listName: 'Groceries',
      };

      const result = toUnifiedTask(reminder);

      expect(result.id).toBe('rem-abc-123');
      expect(result.title).toBe('Buy milk');
      expect(result.dueDate).toBe('2024-01-15T10:00:00Z');
      expect(result.source).toBe(TaskSource.REMINDERS);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
      expect(result.list).toBe('Groceries');
      expect(result.completed).toBe(false);
    });

    it('should map priority "high" to HIGH', () => {
      const reminder: RemindctlReminder = {
        id: '1',
        title: 'High priority',
        isCompleted: false,
        priority: 'high',
        listID: 'list-1',
        listName: 'Work',
      };

      const result = toUnifiedTask(reminder);
      expect(result.priority).toBe(TaskPriority.HIGH);
    });

    it('should map priority "medium" to MEDIUM', () => {
      const reminder: RemindctlReminder = {
        id: '2',
        title: 'Medium priority',
        isCompleted: false,
        priority: 'medium',
        listID: 'list-1',
        listName: 'Work',
      };

      const result = toUnifiedTask(reminder);
      expect(result.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should map priority "low" to LOW', () => {
      const reminder: RemindctlReminder = {
        id: '3',
        title: 'Low priority',
        isCompleted: false,
        priority: 'low',
        listID: 'list-1',
        listName: 'Work',
      };

      const result = toUnifiedTask(reminder);
      expect(result.priority).toBe(TaskPriority.LOW);
    });

    it('should map priority "none" to NONE', () => {
      const reminder: RemindctlReminder = {
        id: '4',
        title: 'No priority',
        isCompleted: false,
        priority: 'none',
        listID: 'list-1',
        listName: 'Work',
      };

      const result = toUnifiedTask(reminder);
      expect(result.priority).toBe(TaskPriority.NONE);
    });

    it('should handle missing optional dueDate', () => {
      const reminder: RemindctlReminder = {
        id: '5',
        title: 'Minimal reminder',
        isCompleted: true,
        priority: 'none',
        listID: 'list-1',
        listName: 'Inbox',
      };

      const result = toUnifiedTask(reminder);

      expect(result.dueDate).toBeUndefined();
      expect(result.list).toBe('Inbox');
      expect(result.completed).toBe(true);
    });
  });
});
