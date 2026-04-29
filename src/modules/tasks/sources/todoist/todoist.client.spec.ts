import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TodoistClient } from './todoist.client';
import { TodoistApiError } from '@common/exceptions/index';

global.fetch = jest.fn();

describe('TodoistClient', () => {
  let client: TodoistClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoistClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-token'),
          },
        },
      ],
    }).compile();

    client = module.get<TodoistClient>(TodoistClient);
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return tasks on success', async () => {
      const mockTasks = [
        {
          id: '1',
          content: 'Task 1',
          description: '',
          project_id: 'p1',
          checked: false,
          priority: 1 as const,
          due: null,
          added_at: '',
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ results: mockTasks, next_cursor: null }),
      });

      const result = await client.getTasks();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.todoist.com/api/v1/tasks',
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-token' },
        }),
      );
      expect(result).toEqual(mockTasks);
    });

    it('should throw TodoistApiError on 401', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
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

    it('should throw TodoistApiError on 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.getTasks()).rejects.toThrow(TodoistApiError);
    });
  });

  describe('getProjects', () => {
    it('should return projects on success', async () => {
      const mockProjects = [
        {
          id: 'p1',
          name: 'Inbox',
          color: 'grey',
          is_shared: false,
          is_favorite: false,
        },
      ];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({ results: mockProjects, next_cursor: null }),
      });

      const result = await client.getProjects();

      expect(result).toEqual(mockProjects);
    });
  });
});
