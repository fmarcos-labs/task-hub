import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@config/env.constants';
import { TodoistApiError } from '@common/exceptions/index';
import type {
  TodoistTask,
  TodoistProject,
  TodoistTasksResponse,
  TodoistProjectsResponse,
} from './todoist.types';

const BASE_URL = 'https://api.todoist.com/api/v1';
const TIMEOUT_MS = 10_000;

@Injectable()
export class TodoistClient {
  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return this.config.get<string>(ENV_KEYS.TODOIST_API_TOKEN) ?? '';
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getTasks(): Promise<TodoistTask[]> {
    const all: TodoistTask[] = [];
    let cursor: string | null = null;

    do {
      const url = cursor
        ? `${BASE_URL}/tasks?cursor=${cursor}`
        : `${BASE_URL}/tasks`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new TodoistApiError(
          `Todoist API error: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      const data = (await response.json()) as TodoistTasksResponse;
      all.push(...data.results);
      cursor = data.next_cursor;
    } while (cursor !== null);

    return all;
  }

  async getProjects(): Promise<TodoistProject[]> {
    const all: TodoistProject[] = [];
    let cursor: string | null = null;

    do {
      const url = cursor
        ? `${BASE_URL}/projects?cursor=${cursor}`
        : `${BASE_URL}/projects`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new TodoistApiError(
          `Todoist API error: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      const data = (await response.json()) as TodoistProjectsResponse;
      all.push(...data.results);
      cursor = data.next_cursor;
    } while (cursor !== null);

    return all;
  }
}
