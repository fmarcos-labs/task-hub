import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@config/env.constants';
import { TodoistApiError } from '@common/exceptions/index';
import type { TodoistTask, TodoistProject } from './todoist.types';

const BASE_URL = 'https://api.todoist.com/rest/v2';
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
    const response = await this.fetchWithTimeout(`${BASE_URL}/tasks`);

    if (!response.ok) {
      throw new TodoistApiError(
        `Todoist API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return response.json() as Promise<TodoistTask[]>;
  }

  async getProjects(): Promise<TodoistProject[]> {
    const response = await this.fetchWithTimeout(`${BASE_URL}/projects`);

    if (!response.ok) {
      throw new TodoistApiError(
        `Todoist API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    return response.json() as Promise<TodoistProject[]>;
  }
}
