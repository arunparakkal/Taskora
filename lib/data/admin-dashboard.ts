import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile, TaskWithDetails } from "@/types/database";

export type AdminDashboardStats = {
  users: {
    total: number;
    byRole: Record<AppRole, number>;
    recent: Profile[];
  };
  teams: { total: number };
  projects: { total: number; active: number };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    unassigned: number;
    overdue: number;
    recent: TaskWithDetails[];
  };
};

export const getAdminDashboardStats = cache(
  async (): Promise<AdminDashboardStats> => {
    const supabase = await createClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      usersCountRes,
      rolesRes,
      recentUsersRes,
      teamsCountRes,
      projectsRes,
      taskSummaryRes,
      recentTasksRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("role"),
      supabase
        .from("profiles")
        .select("id, email, full_name, role, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("teams").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("id, status"),
      supabase.from("tasks").select("status, assignee_id, due_date"),
      supabase
        .from("tasks")
        .select(
          "id, title, status, priority, project:projects(key, name), assignee:profiles!tasks_assignee_id_fkey(full_name, email)"
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const byRole: Record<AppRole, number> = {
      admin: 0,
      team_lead: 0,
      member: 0,
    };
    for (const row of rolesRes.data ?? []) {
      const role = row.role as AppRole;
      byRole[role] = (byRole[role] ?? 0) + 1;
    }

    const byStatus: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    let unassigned = 0;
    let overdue = 0;

    for (const task of taskSummaryRes.data ?? []) {
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
      if (!task.assignee_id) unassigned++;
      if (task.due_date && task.status !== "done") {
        const due = new Date(task.due_date);
        if (due < today) overdue++;
      }
    }

    const projects = projectsRes.data ?? [];

    return {
      users: {
        total: usersCountRes.count ?? 0,
        byRole,
        recent: (recentUsersRes.data ?? []) as Profile[],
      },
      teams: { total: teamsCountRes.count ?? 0 },
      projects: {
        total: projects.length,
        active: projects.filter((p) => p.status === "active").length,
      },
      tasks: {
        total: taskSummaryRes.data?.length ?? 0,
        byStatus,
        unassigned,
        overdue,
        recent: (recentTasksRes.data ?? []) as unknown as TaskWithDetails[],
      },
    };
  }
);
