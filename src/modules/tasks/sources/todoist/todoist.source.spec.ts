import { Test, TestingModule } from '@nestjs/testing';
import { TodoistSource } from './todoist.source';
import { TodoistClient } from './todoist.client';
import { TaskSource } from '../../dto/index';
import type { TodoistTask, TodoistProject } from './todoist.types';

const makeTask = (id: string, checked: boolean): TodoistTask => ({
  id,
  content: `Task ${id}`,
  description: '',
  project_id: 'p1',
  checked,
  priority: 1,
  due: null,
  added_at: '',
});

const makeProject = (): TodoistProject => ({
  id: 'p1',
  name: 'Inbox',
  color: 'grey',
  is_shared: false,
  is_favorite: false,
});

describe('TodoistSource', () => {
  let source: TodoistSource;
  let client: jest.Mocked<TodoistClient>;

  beforeEach(async () => {
    client = {
      getTasks: jest.fn(),
      getProjects: jest.fn(),
    } as unknown as jest.Mocked<TodoistClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [TodoistSource, { provide: TodoistClient, useValue: client }],
    }).compile();

    source = module.get<TodoistSource>(TodoistSource);
  });

  it('should have correct name', () => {
    expect(source.name).toBe(TaskSource.TODOIST);
  });

  describe('fetch', () => {
    it('should return only unchecked tasks', async () => {
      client.getTasks.mockResolvedValue([
        makeTask('1', false),
        makeTask('2', true),
        makeTask('3', false),
      ]);
      client.getProjects.mockResolvedValue([makeProject()]);

      const result = await source.fetch();

      expect(result).toHaveLength(2);
      expect(result.every((t) => !t.completed)).toBe(true);
      expect(result.map((t) => t.id)).toEqual(['tdo-1', 'tdo-3']);
    });

    it('should return empty array when all tasks are checked', async () => {
      client.getTasks.mockResolvedValue([
        makeTask('1', true),
        makeTask('2', true),
      ]);
      client.getProjects.mockResolvedValue([makeProject()]);

      const result = await source.fetch();

      expect(result).toEqual([]);
    });

    it('should return empty array when no tasks', async () => {
      client.getTasks.mockResolvedValue([]);
      client.getProjects.mockResolvedValue([]);

      const result = await source.fetch();

      expect(result).toEqual([]);
    });

    it('should return empty array on client error', async () => {
      client.getTasks.mockRejectedValue(new Error('API error'));
      client.getProjects.mockResolvedValue([]);

      const result = await source.fetch();

      expect(result).toEqual([]);
    });
  });
});
