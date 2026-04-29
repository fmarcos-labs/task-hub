import { UnifiedTaskDto } from '../dto/index.js';
import { TaskSource } from '../dto/task-source.enum.js';

export interface ITaskSource {
  readonly name: TaskSource;
  fetch(): Promise<UnifiedTaskDto[]>;
}
