import { spawn } from 'node:child_process';
import type { SpawnOptionsWithoutStdio } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
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
  const tmpFile = join(tmpdir(), `remindctl-${randomUUID()}.json`);

  return new Promise((resolve, reject) => {
    const options: SpawnOptionsWithoutStdio = { timeout: timeoutMs };
    const proc = spawn(
      'remindctl',
      ['list', '--json', '--output', tmpFile],
      options,
    );

    let stderr = '';

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

      readFile(tmpFile, 'utf-8')
        .then((content) => {
          const parsed = JSON.parse(content) as RemindctlOutput;
          resolve(parsed);
        })
        .catch((error: Error) => {
          reject(
            new RemindctlError(
              `Failed to parse remindctl output: ${error.message}`,
              1,
              stderr,
            ),
          );
        });
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
