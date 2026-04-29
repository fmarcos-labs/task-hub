import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { RemindersSource } from './sources/reminders/reminders.source.js';
import { TodoistClient } from './sources/todoist/todoist.client.js';
import { TodoistSource } from './sources/todoist/todoist.source.js';
import { TasksCacheService } from './cache/tasks-cache.service.js';
import { TasksRefreshScheduler } from './cache/tasks-refresh.scheduler.js';

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    RemindersSource,
    TodoistClient,
    TodoistSource,
    TasksCacheService,
    TasksRefreshScheduler,
  ],
  exports: [TasksService, TasksCacheService],
})
export class TasksModule {}
