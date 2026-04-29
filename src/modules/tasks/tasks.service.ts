import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto } from './dto/index.js';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  async getTasks(): Promise<UnifiedTaskDto[]> {
    this.logger.debug('Fetching tasks');
    await Promise.resolve();
    return [];
  }

  async refresh(): Promise<{ count: number; refreshedAt: string }> {
    this.logger.debug('Refreshing tasks');
    await Promise.resolve();
    return {
      count: 0,
      refreshedAt: new Date().toISOString(),
    };
  }
}
