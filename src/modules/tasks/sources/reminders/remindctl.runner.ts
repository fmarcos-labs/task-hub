import { spawn } from 'node:child_process';
import type { SpawnOptionsWithoutStdio } from 'node:child_process';
import { RemindctlError } from '@common/exceptions/index';

export interface RemindctlReminder {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
  priority: number;
  list?: {
    name: string;
  };
}

export interface RemindctlOutput {
  reminders: RemindctlReminder[];
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function runRemindctl(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<RemindctlOutput> {
  return new Promise((resolve, reject) => {
    const options: SpawnOptionsWithoutStdio = { timeout: timeoutMs };
    const proc = spawn('remindctl', ['list', '--json'], options);

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
        const parsed = JSON.parse(stdout) as RemindctlOutput;
        resolve(parsed);
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
