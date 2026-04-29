import { ApiProperty } from '@nestjs/swagger';
import { TaskSource } from './task-source.enum';
import { TaskPriority } from './task-priority.enum';

export class UnifiedTaskDto {
  @ApiProperty({ example: 'abc-123' })
  readonly id!: string;

  @ApiProperty({ example: 'Comprar leche' })
  readonly title!: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  readonly dueDate?: string;

  @ApiProperty({ enum: TaskSource, example: TaskSource.TODOIST })
  readonly source!: TaskSource;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.MEDIUM })
  readonly priority!: TaskPriority;

  @ApiProperty({ example: 'Compras', required: false })
  readonly list?: string;

  @ApiProperty({ example: false })
  readonly completed!: boolean;
}
