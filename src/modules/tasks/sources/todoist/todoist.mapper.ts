import { UnifiedTaskDto, TaskSource, TaskPriority } from '../../dto';
import type { TodoistTask, TodoistProject } from './todoist.types';

function mapPriority(priority: 1 | 2 | 3 | 4): TaskPriority {
  switch (priority) {
    case 4:
      return TaskPriority.HIGH;
    case 3:
      return TaskPriority.MEDIUM;
    case 2:
      return TaskPriority.LOW;
    default:
      return TaskPriority.NONE;
  }
}

export function toUnifiedTask(
  task: TodoistTask,
  projectsById: Map<string, TodoistProject>,
): UnifiedTaskDto {
  return {
    id: `tdo-${task.id}`,
    title: task.content,
    dueDate: task.due?.date,
    source: TaskSource.TODOIST,
    priority: mapPriority(task.priority),
    list: projectsById.get(task.project_id)?.name,
    completed: task.is_completed,
  };
}
