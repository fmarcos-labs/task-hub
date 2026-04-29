export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  project_id: string;
  is_completed: boolean;
  priority: 1 | 2 | 3 | 4;
  due: {
    date: string;
    string: string;
    timezone: string | null;
    is_recurring: boolean;
  } | null;
  created_at: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  is_shared: boolean;
  is_favorite: boolean;
}
