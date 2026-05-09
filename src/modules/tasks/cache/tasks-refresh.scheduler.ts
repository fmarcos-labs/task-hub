import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@config/env.constants';
import { TasksCacheService } from './tasks-cache.service';

@Injectable()
export class TasksRefreshScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TasksRefreshScheduler.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly cache: TasksCacheService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const ttlSeconds = this.config.get<number>(ENV_KEYS.CACHE_TTL_SECONDS, 300);
    const intervalMs = ttlSeconds * 1000;

    this.logger.log(`Starting periodic cache refresh every ${ttlSeconds}s`);

    this.intervalId = setInterval(() => {
      this.cache.refresh().catch((error: Error) => {
        this.logger.error(`Periodic refresh failed: ${error.message}`);
      });
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.logger.log('Periodic cache refresh stopped');
    }
  }
}
