import { Injectable, Logger, Inject } from '@nestjs/common';
import { UnifiedTaskDto } from '../dto/index.js';
import type { ITaskSource } from '../sources/task-source.interface.js';

export const TASK_SOURCES = 'TASK_SOURCES';

@Injectable()
export class TasksCacheService {
  private readonly logger = new Logger(TasksCacheService.name);

  private tasks: UnifiedTaskDto[] = [];
  private lastRefreshAt: Date | null = null;
  private refreshing: Promise<{ count: number; refreshedAt: string }> | null =
    null;

  constructor(@Inject(TASK_SOURCES) private readonly sources: ITaskSource[]) {}

  getAll(): UnifiedTaskDto[] {
    return this.tasks;
  }

  getLastRefreshAt(): string | null {
    return this.lastRefreshAt?.toISOString() ?? null;
  }

  async refresh(): Promise<{ count: number; refreshedAt: string }> {
    if (this.refreshing) {
      this.logger.debug('Refresh already in progress, waiting for it');
      return this.refreshing;
    }

    this.refreshing = this.doRefresh();
    const result = await this.refreshing;
    this.refreshing = null;
    return result;
  }

  private async doRefresh(): Promise<{ count: number; refreshedAt: string }> {
    this.logger.log('Starting cache refresh from all sources');

    const results = await Promise.allSettled(
      this.sources.map((source) => source.fetch()),
    );

    const allTasks: UnifiedTaskDto[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const source = this.sources[i];

      if (result.status === 'fulfilled') {
        allTasks.push(...result.value);
        this.logger.debug(
          `Source ${source.name} returned ${result.value.length} tasks`,
        );
      } else {
        this.logger.error(`Source ${source.name} failed: ${result.reason}`);
      }
    }

    this.tasks = allTasks;
    this.lastRefreshAt = new Date();

    this.logger.log(`Cache refreshed: ${allTasks.length} total tasks`);
    return {
      count: allTasks.length,
      refreshedAt: this.lastRefreshAt.toISOString(),
    };
  }
}
