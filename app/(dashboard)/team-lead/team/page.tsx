import Link from "next/link";
import {
  UsersRound,
  FolderKanban,
  CheckSquare,
  ListTodo,
  ChevronRight,
} from "lucide-react";
import { PageShell, EmptyState } from "@/components/layout/dashboard-shell";
import { StatCard, StatsGrid } from "@/components/admin/stat-card";
import { RoleBadge } from "@/components/shared/badges";
import { WorkloadBadge } from "@/components/shared/workload-badge";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/get-profile";
import { getLedTeamsOverview } from "@/lib/data/team-lead";
import { summarizeAvailability } from "@/lib/workload/member-workload";

export default async function TeamLeadTeamPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const teams = await getLedTeamsOverview(profile.id);

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const totalProjects = teams.reduce((sum, t) => sum + t.projectCount, 0);
  const totalTasks = teams.reduce((sum, t) => sum + t.taskCount, 0);
  const openTasks = teams.reduce((sum, t) => sum + t.openTasks, 0);

  const allWorkloads = Object.fromEntries(
    teams.flatMap((t) =>
      Object.entries(t.memberWorkloads).map(([id, w]) => [id, w])
    )
  );
  const capacitySummary = summarizeAvailability(allWorkloads);

  return (
    <PageShell
      title="My Team"
      description="Member workload — sorted by who has capacity for new tasks"
      stats={
        <StatsGrid>
          <StatCard
            label="Available"
            value={capacitySummary.available}
            subtext="Ready for new tasks"
            icon={UsersRound}
            accent="green"
          />
          <StatCard
            label="Moderate"
            value={capacitySummary.moderate}
            subtext="Can take more with care"
            icon={UsersRound}
            accent="orange"
          />
          <StatCard
            label="At Capacity"
            value={capacitySummary.atCapacity}
            subtext="Limited slots left"
            icon={ListTodo}
            accent="purple"
          />
          <StatCard
            label="Overloaded"
            value={capacitySummary.overloaded}
            subtext={`${openTasks} open tasks total`}
            icon={CheckSquare}
            accent="blue"
          />
        </StatsGrid>
      }
    >
      {teams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No teams assigned"
          description="When an admin assigns you as team lead, your teams will appear here."
        />
      ) : (
        <div className="space-y-8">
          {teams.map(
            ({
              team,
              members,
              projectCount,
              taskCount,
              openTasks: teamOpenTasks,
              memberWorkloads,
            }) => (
              <Card key={team.id} className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={team.name} />
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.description && (
                          <p className="mt-0.5 text-sm text-slate-500">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <UsersRound className="h-4 w-4 text-slate-400" />
                        {members.length} member{members.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FolderKanban className="h-4 w-4 text-slate-400" />
                        {projectCount} project{projectCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-slate-400" />
                        {teamOpenTasks} open · {taskCount} total
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {members.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-slate-500">
                      No members in this team yet.
                    </p>
                  ) : (
                    <DataTableCard total={members.length} scrollable={false}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Active</TableHead>
                            <TableHead className="text-right">Open</TableHead>
                            <TableHead className="text-right">Overdue</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Profile</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => {
                            const workload = memberWorkloads[member.id] ?? {
                              activeTasks: 0,
                              openTasks: 0,
                              overdueTasks: 0,
                              capacity: 5,
                              availability: 5,
                              status: "available" as const,
                              statusLabel: "Available",
                            };
                            return (
                              <TableRow key={member.id} className="group">
                                <TableCell>
                                  <Link
                                    href={`/team-lead/members/${member.id}`}
                                    className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                                  >
                                    <EntityAvatar
                                      name={member.full_name || member.email}
                                      size="sm"
                                    />
                                    <div>
                                      <p className="font-medium text-slate-900 group-hover:text-blue-600">
                                        {member.full_name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {member.email}
                                      </p>
                                    </div>
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <RoleBadge role={member.role} />
                                </TableCell>
                                <TableCell className="text-right text-slate-700">
                                  {workload.activeTasks}/{workload.capacity}
                                </TableCell>
                                <TableCell className="text-right text-slate-700">
                                  {workload.openTasks}
                                </TableCell>
                                <TableCell className="text-right text-slate-700">
                                  {workload.overdueTasks > 0 ? (
                                    <span className="font-medium text-red-600">
                                      {workload.overdueTasks}
                                    </span>
                                  ) : (
                                    "0"
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                  {Math.max(workload.availability, 0)} slot
                                  {Math.max(workload.availability, 0) !== 1
                                    ? "s"
                                    : ""}{" "}
                                  free
                                </TableCell>
                                <TableCell>
                                  <WorkloadBadge status={workload.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/team-lead/members/${member.id}`}>
                                      View
                                      <ChevronRight className="ml-1 h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </DataTableCard>
                  )}
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </PageShell>
  );
}
