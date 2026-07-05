export type AppRole = "admin" | "team_lead" | "member";
export type TaskStatus = "todo" | "in_progress" | "review" | "rework" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "active" | "paused" | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  lead_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  team_id: string;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  review_cycles: number;
  reopened_count: number;
}

export type TaskActivityAction =
  | "status_changed"
  | "approved"
  | "changes_requested"
  | "reopened";

export interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  from_status: TaskStatus | null;
  to_status: TaskStatus | null;
  action: TaskActivityAction;
  comment: string | null;
  created_at: string;
}

export type NotificationType =
  | "task_rejected"
  | "task_approved"
  | "task_reopened";

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  task_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PerformanceSnapshot {
  id: string;
  user_id: string;
  team_id: string | null;
  period_type: string;
  period_start: string;
  period_end: string;
  quality: number;
  delivery: number;
  productivity: number;
  reliability: number;
  collaboration: number;
  overall: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TeamWithDetails extends Team {
  lead?: Profile | null;
  member_count?: number;
}

export interface ProjectWithDetails extends Project {
  team?: TeamWithDetails | null;
  task_count?: number;
  done_count?: number;
  completion_rate?: number;
}

export interface TeamLeadProjectItem extends ProjectWithDetails {
  members: Profile[];
  last_updated: string;
}

export interface TaskWithDetails extends Task {
  project?: Project | null;
  assignee?: Profile | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Team, "id">>;
      };
      team_members: {
        Row: TeamMember;
        Insert: TeamMember;
        Update: Partial<TeamMember>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Project, "id">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<
          Task,
          "id" | "created_at" | "completed_at" | "review_cycles" | "reopened_count"
        > & {
          id?: string;
          created_at?: string;
          completed_at?: string | null;
          review_cycles?: number;
          reopened_count?: number;
        };
        Update: Partial<Omit<Task, "id">>;
      };
      task_activity: {
        Row: TaskActivity;
        Insert: Omit<TaskActivity, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TaskActivity, "id">>;
      };
      performance_snapshots: {
        Row: PerformanceSnapshot;
        Insert: Omit<PerformanceSnapshot, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PerformanceSnapshot, "id">>;
      };
    };
  };
}
