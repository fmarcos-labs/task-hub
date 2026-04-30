import { UnifiedTaskDto } from '../../dto/index.js';
import { TaskSource, TaskPriority } from '../../dto/index.js';
import type { RemindctlReminder } from './remindctl.runner.js';

function mapPriority(priority: RemindctlReminder['priority']): TaskPriority {
  switch (priority) {
    case 'high':
      return TaskPriority.HIGH;
    case 'medium':
      return TaskPriority.MEDIUM;
    case 'low':
      return TaskPriority.LOW;
    default:
      return TaskPriority.NONE;
  }
}

export function toUnifiedTask(reminder: RemindctlReminder): UnifiedTaskDto {
  return {
    id: `rem-${reminder.id}`,
    title: reminder.title,
    dueDate: reminder.dueDate,
    source: TaskSource.REMINDERS,
    priority: mapPriority(reminder.priority),
    list: reminder.listName,
    completed: reminder.isCompleted,
  };
}
