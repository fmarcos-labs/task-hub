import { Injectable, Logger } from '@nestjs/common';
import { UnifiedTaskDto, TaskSource } from '../../dto';
import type { ITaskSource } from '../task-source.interface';
import { TodoistClient } from './todoist.client';
import { toUnifiedTask } from './todoist.mapper';

@Injectable()
export class TodoistSource implements ITaskSource {
  readonly name = TaskSource.TODOIST;
  private readonly logger = new Logger(TodoistSource.name);

  constructor(private readonly client: TodoistClient) {}

  async fetch(): Promise<UnifiedTaskDto[]> {
    try {
      const start = Date.now();
      const [tasks, projects] = await Promise.all([
        this.client.getTasks(),
        this.client.getProjects(),
      ]);

      const projectsById = new Map(projects.map((p) => [p.id, p]));
      const unifiedTasks = tasks.map((task) =>
        toUnifiedTask(task, projectsById),
      );

      this.logger.log(
        `Fetched ${unifiedTasks.length} Todoist tasks in ${Date.now() - start}ms`,
      );
      return unifiedTasks;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Todoist tasks: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
