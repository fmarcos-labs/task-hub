import { Test, TestingModule } from '@nestjs/testing';
import { RemindersSource } from './reminders.source';
import { runRemindctl } from './remindctl.runner';
import { TaskSource } from '../../dto/index';

jest.mock('./remindctl.runner');

describe('RemindersSource', () => {
  let source: RemindersSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RemindersSource],
    }).compile();

    source = module.get<RemindersSource>(RemindersSource);
  });

  it('should be defined', () => {
    expect(source).toBeDefined();
  });

  it('should have correct name', () => {
    expect(source.name).toBe(TaskSource.REMINDERS);
  });

  describe('fetch', () => {
    it('should return mapped tasks on success', async () => {
      const mockReminders = [
        {
          id: '123',
          title: 'Test task',
          isCompleted: false,
          priority: 'none',
          listID: 'list-1',
          listName: 'Inbox',
        },
      ];
      (runRemindctl as jest.Mock).mockResolvedValue(mockReminders);

      const result = await source.fetch();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rem-123');
      expect(result[0].title).toBe('Test task');
      expect(result[0].source).toBe(TaskSource.REMINDERS);
    });

    it('should return empty array on error', async () => {
      (runRemindctl as jest.Mock).mockRejectedValue(
        new Error('Command failed'),
      );

      const result = await source.fetch();

      expect(result).toEqual([]);
    });

    it('should return empty array when no reminders', async () => {
      (runRemindctl as jest.Mock).mockResolvedValue([]);

      const result = await source.fetch();

      expect(result).toEqual([]);
    });
  });
});
