import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto } from './dto/index.js';
import { RemindersSource } from './sources/reminders/reminders.source.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly remindersSource: RemindersSource) {}

  async getTasks(): Promise<UnifiedTaskDto[]> {
    this.logger.debug('Fetching tasks from all sources');
    const reminders = await this.remindersSource.fetch();
    return reminders;
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
