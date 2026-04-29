import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto } from './dto/index.js';
import { RemindersSource } from './sources/reminders/reminders.source.js';
import { TodoistSource } from './sources/todoist/todoist.source.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly remindersSource: RemindersSource,
    private readonly todoistSource: TodoistSource,
  ) {}

  async getTasks(): Promise<UnifiedTaskDto[]> {
    this.logger.debug('Fetching tasks from all sources');
    const [reminders, todoistTasks] = await Promise.all([
      this.remindersSource.fetch(),
      this.todoistSource.fetch(),
    ]);
    return [...reminders, ...todoistTasks];
  }

  async refresh(): Promise<{ count: number; refreshedAt: string }> {
    this.logger.debug('Refreshing tasks');
    const tasks = await this.getTasks();
    return {
      count: tasks.length,
      refreshedAt: new Date().toISOString(),
    };
  }
}
