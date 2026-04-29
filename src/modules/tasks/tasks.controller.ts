import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { TasksService } from './tasks.service.js';
import { UnifiedTaskDto } from './dto/index.js';

@ApiTags('Tasks')
@SkipThrottle()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get unified tasks from all sources' })
  @ApiResponse({
    status: 200,
    description: 'List of tasks',
    type: [UnifiedTaskDto],
  })
  async getTasks(@Res() reply: FastifyReply) {
    const tasks = await this.tasksService.getTasks();
    await reply.status(HttpStatus.OK).send(tasks);
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh tasks from all sources' })
  @ApiResponse({ status: 200, description: 'Refresh result' })
  async refresh(@Res() reply: FastifyReply) {
    const result = await this.tasksService.refresh();
    await reply.status(HttpStatus.OK).send(result);
  }
}
