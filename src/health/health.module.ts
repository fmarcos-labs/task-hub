import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TasksModule } from '../modules/tasks/index.js';

@Module({
  imports: [TasksModule],
  controllers: [HealthController],
})
export class HealthModule {}
