import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TodoistClient } from './todoist.client';
import { TodoistApiError } from '@common/exceptions/index';

global.fetch = jest.fn();

const mockTask = (id: string) => ({
  id,
  content: `Task ${id}`,
  description: '',
  project_id: 'p1',
  checked: false,
  priority: 1 as const,
  due: null,
  added_at: '',
});

const mockProject = (id: string) => ({
  id,
  name: `Project ${id}`,
  color: 'grey',
  is_shared: false,
  is_favorite: false,
});

describe('TodoistClient', () => {
  let client: TodoistClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoistClient,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('fake-token') },
        },
      ],
    }).compile();

    client = module.get<TodoistClient>(TodoistClient);
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return tasks when single page (next_cursor null)', async () => {
      const tasks = [mockTask('1'), mockTask('2')];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ results: tasks, next_cursor: null }),
      });

      const result = await client.getTasks();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.todoist.com/api/v1/tasks',
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
        }),
      );
      expect(result).toEqual(tasks);
    });

    it('should fetch all pages when next_cursor is present', async () => {
      const page1 = [mockTask('1')];
      const page2 = [mockTask('2'), mockTask('3')];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue({ results: page1, next_cursor: 'cursor-abc' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue({ results: page2, next_cursor: null }),
        });

      const result = await client.getTasks();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.todoist.com/api/v1/tasks?cursor=cursor-abc',
        expect.anything(),
      );
      expect(result).toEqual([...page1, ...page2]);
    });

    it('should throw TodoistApiError if first page fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.getTasks()).rejects.toThrow(TodoistApiError);
    });

    it('should throw TodoistApiError if second page fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            results: [mockTask('1')],
            next_cursor: 'cursor-abc',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      await expect(client.getTasks()).rejects.toThrow(TodoistApiError);
    });

    it('should throw TodoistApiError on 429', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(client.getTasks()).rejects.toThrow(TodoistApiError);
    });
  });

  describe('getProjects', () => {
    it('should return all projects across pages', async () => {
      const page1 = [mockProject('p1')];
      const page2 = [mockProject('p2')];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue({ results: page1, next_cursor: 'cursor-xyz' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest
            .fn()
            .mockResolvedValue({ results: page2, next_cursor: null }),
        });

      const result = await client.getProjects();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([...page1, ...page2]);
    });

    it('should throw TodoistApiError on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(client.getProjects()).rejects.toThrow(TodoistApiError);
    });
  });
});
