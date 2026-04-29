import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { RemindersSource } from './sources/reminders/reminders.source.js';
import { TodoistClient } from './sources/todoist/todoist.client.js';
import { TodoistSource } from './sources/todoist/todoist.source.js';

@Module({
  controllers: [TasksController],
  providers: [TasksService, RemindersSource, TodoistClient, TodoistSource],
  exports: [TasksService],
})
export class TasksModule {}
