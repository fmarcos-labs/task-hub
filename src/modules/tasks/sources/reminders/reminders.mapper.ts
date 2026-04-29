import { UnifiedTaskDto } from '../../dto/index.js';
import { TaskSource, TaskPriority } from '../../dto/index.js';
import type { RemindctlReminder } from './remindctl.runner.js';

function mapPriority(priority: number): TaskPriority {
  switch (priority) {
    case 9:
      return TaskPriority.HIGH;
    case 5:
      return TaskPriority.MEDIUM;
    case 1:
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
    list: reminder.list?.name,
    completed: reminder.isCompleted,
  };
}
