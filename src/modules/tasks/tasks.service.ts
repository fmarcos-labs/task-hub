import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto } from './dto/index.js';
import { TasksCacheService } from './cache/tasks-cache.service.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly cache: TasksCacheService) {}

  async getTasks(): Promise<UnifiedTaskDto[]> {
    this.logger.debug('Getting tasks from cache');
    await Promise.resolve();
    return this.cache.getAll();
  }

  async refresh(): Promise<{ count: number; refreshedAt: string }> {
    this.logger.debug('Forcing cache refresh');
    return this.cache.refresh();
  }
}
