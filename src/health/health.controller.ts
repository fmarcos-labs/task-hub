import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { TasksCacheService } from '../modules/tasks/cache/tasks-cache.service';
import { ENV_KEYS } from '@config/env.constants';
import { HealthResponseDto, CacheStatusDto } from './dto/health-response.dto';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly bootTime = Date.now();

  constructor(
    private readonly cache: TasksCacheService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    description: 'Service healthy',
    type: HealthResponseDto,
  })
  @ApiResponse({ status: 503, description: 'Service degraded' })
  async check(@Res() reply: FastifyReply) {
    const lastRefreshAt = this.cache.getLastRefreshAt();
    const ttlSeconds = this.config.get<number>(ENV_KEYS.CACHE_TTL_SECONDS, 300);
    const taskCount = this.cache.getAll().length;

    const cacheStatus: CacheStatusDto = {
      lastRefreshAt,
      ageSeconds: lastRefreshAt
        ? Math.floor((Date.now() - new Date(lastRefreshAt).getTime()) / 1000)
        : null,
      taskCount,
    };

    const timeSinceBoot = Math.floor((Date.now() - this.bootTime) / 1000);
    const isDegraded = !lastRefreshAt && timeSinceBoot > 2 * ttlSeconds;

    if (isDegraded) {
      await reply.status(HttpStatus.SERVICE_UNAVAILABLE).send({
        status: 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        cache: cacheStatus,
      });
      return;
    }

    await reply.status(HttpStatus.OK).send({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      cache: cacheStatus,
    });
  }
}
