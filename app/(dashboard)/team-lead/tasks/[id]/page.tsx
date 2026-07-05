import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { TaskDetailView } from "@/components/tasks/task-detail-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getLedTeamIds } from "@/lib/data/team-lead";
import { getTaskActivity, getTaskById } from "@/lib/data/tasks";

export default async function TeamLeadTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [task, activity, ledTeamIds] = await Promise.all([
    getTaskById(id),
    getTaskActivity(id),
    getLedTeamIds(profile.id),
  ]);

  const teamId = task?.project?.team_id;
  if (!task || !teamId || !ledTeamIds.includes(teamId)) {
    notFound();
  }

  const isArchived = task.project?.status === "archived";

  return (
    <PageShell
      title={task.title}
      description={`[${task.project?.key ?? "—"}] ${task.project?.name ?? "Project"}`}
    >
      <TaskDetailView
        task={task}
        activity={activity}
        backHref="/team-lead/tasks"
        variant="team_lead"
        statusDisabled={isArchived}
      />
    </PageShell>
  );
}
