export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  checked: boolean;
  priority: 1 | 2 | 3 | 4;
  due: {
    date: string;
    string: string;
    timezone: string | null;
    is_recurring: boolean;
  } | null;
  added_at: string;
}

export interface TodoistTasksResponse {
  results: TodoistTask[];
  next_cursor: string | null;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  is_shared: boolean;
  is_favorite: boolean;
}

export interface TodoistProjectsResponse {
  results: TodoistProject[];
  next_cursor: string | null;
}
