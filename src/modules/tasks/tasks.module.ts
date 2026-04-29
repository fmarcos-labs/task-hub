import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { RemindersSource } from './sources/reminders/reminders.source.js';

@Module({
  controllers: [TasksController],
  providers: [TasksService, RemindersSource],
  exports: [TasksService],
})
export class TasksModule {}
