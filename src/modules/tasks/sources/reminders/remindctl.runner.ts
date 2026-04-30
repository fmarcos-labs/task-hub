import { spawn } from 'node:child_process';
import type { SpawnOptionsWithoutStdio } from 'node:child_process';
import { RemindctlError } from '@common/exceptions/index';

export interface RemindctlList {
  id: string;
  title: string;
  reminderCount: number;
  overdueCount: number;
}

export interface RemindctlReminder {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  priority: 'none' | 'low' | 'medium' | 'high';
  listID: string;
  listName: string;
}

const DEFAULT_TIMEOUT_MS = 10_000;

async function spawnRemindctl(
  args: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options: SpawnOptionsWithoutStdio = { timeout: timeoutMs };
    const proc = spawn('remindctl', args, options);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(
          new RemindctlError(
            `remindctl exited with code ${exitCode}`,
            exitCode ?? 1,
            stderr,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(
          new RemindctlError(
            `Failed to parse remindctl output: ${(error as Error).message}`,
            1,
            stderr,
          ),
        );
      }
    });

    proc.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new RemindctlError('remindctl not found', 127, 'Command not found'),
        );
      } else {
        reject(
          new RemindctlError(
            `Failed to run remindctl: ${error.message}`,
            1,
            stderr,
          ),
        );
      }
    });
  });
}

export async function runRemindctl(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RemindctlReminder[]> {
  const lists = (await spawnRemindctl(
    ['list', '--json'],
    timeoutMs,
  )) as RemindctlList[];

  const listsWithReminders = lists.filter((l) => l.reminderCount > 0);

  const results = await Promise.allSettled(
    listsWithReminders.map((list) =>
      spawnRemindctl(['list', list.title, '--json'], timeoutMs),
    ),
  );

  const all: RemindctlReminder[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const reminders = result.value as RemindctlReminder[];
      all.push(...reminders.filter((r) => !r.isCompleted));
    }
  }

  return all;
}
