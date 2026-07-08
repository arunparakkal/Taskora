import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/dashboard-shell";
import { TaskDetailView } from "@/components/tasks/task-detail-view";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getTaskActivity, getTaskById } from "@/lib/data/tasks";

export default async function MemberTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [task, activity] = await Promise.all([
    getTaskById(id),
    getTaskActivity(id),
  ]);

  if (!task || task.assignee_id !== profile.id) {
    notFound();
  }

  return (
    <PageShell title="" hideHeader>
      <TaskDetailView task={task} activity={activity} />
    </PageShell>
  );
}
