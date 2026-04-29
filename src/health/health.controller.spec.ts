import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply } from 'fastify';
import { HealthController } from './health.controller';
import { TasksCacheService } from '../modules/tasks/cache/tasks-cache.service';
import { ConfigService } from '@nestjs/config';

const createMockReply = (): FastifyReply => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as FastifyReply;
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: TasksCacheService,
          useValue: {
            getLastRefreshAt: jest
              .fn()
              .mockReturnValue(new Date().toISOString()),
            getAll: jest.fn().mockReturnValue([
              {
                id: '1',
                title: 'Task',
                source: 'reminders',
                priority: 'none',
                completed: false,
              },
            ]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(300),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should return 200 ok with cache info', async () => {
    const reply = createMockReply();

    await controller.check(reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        uptime: expect.any(Number) as unknown as number,
        timestamp: expect.any(String) as unknown as string,
        cache: expect.objectContaining({
          lastRefreshAt: expect.any(String),
          taskCount: 1,
        }),
      }),
    );
  });

  it('should return 200 when cache has never refreshed but TTL is large', async () => {
    const mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(undefined),
    } as unknown as FastifyReply;

    const controllerWithNoCache = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: TasksCacheService,
          useValue: {
            getLastRefreshAt: jest.fn().mockReturnValue(null),
            getAll: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(300),
          },
        },
      ],
    })
      .compile()
      .then((m) => m.get<HealthController>(HealthController));

    await controllerWithNoCache.check(mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(200);
  });
});
