import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto, TaskSource } from '../../dto/index.js';
import type { ITaskSource } from '../task-source.interface.js';
import { runRemindctl } from './remindctl.runner.js';
import { toUnifiedTask } from './reminders.mapper.js';

@Injectable()
export class RemindersSource implements ITaskSource {
  readonly name = TaskSource.REMINDERS;
  private readonly logger = new Logger(RemindersSource.name);

  async fetch(): Promise<UnifiedTaskDto[]> {
    try {
      const start = Date.now();
      const reminders = await runRemindctl();
      const tasks = reminders.map(toUnifiedTask);
      this.logger.log(
        `Fetched ${tasks.length} reminders in ${Date.now() - start}ms`,
      );
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to fetch reminders: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
