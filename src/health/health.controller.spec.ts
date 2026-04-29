import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply } from 'fastify';
import { HealthController } from './health.controller';

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
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should return 200 ok with uptime', async () => {
    const reply = createMockReply();

    await controller.check(reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        uptime: expect.any(Number) as unknown as number,
        timestamp: expect.any(String) as unknown as string,
      }),
    );
  });
});
