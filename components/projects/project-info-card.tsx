import Link from "next/link";
import { Calendar, Crown, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { formatDate } from "@/lib/utils";
import type { Profile, ProjectWithDetails } from "@/types/database";

function sortMembersAlphabetically(members: Profile[]): Profile[] {
  return [...members].sort((a, b) =>
    (a.full_name || a.email).localeCompare(b.full_name || b.email)
  );
}

/** Teal pill with crown — matches app-wide team lead styling */
function TeamLeadBadge() {
  return (
    <Badge variant="team_lead" className="gap-1 whitespace-nowrap">
      <Crown className="h-3 w-3" />
      Team Lead
    </Badge>
  );
}

export function ProjectInfoCard({
  project,
  teamMembers,
  memberProfileHref,
}: {
  project: ProjectWithDetails;
  teamMembers: Profile[];
  memberProfileHref?: (memberId: string) => string | undefined;
}) {
  const teamLead = project.team?.lead ?? null;
  const leadId = project.team?.lead_id ?? teamLead?.id;

  const otherMembers = sortMembersAlphabetically(
    teamMembers.filter((m) => m.id !== leadId)
  );
  const memberCount = otherMembers.length + (teamLead ? 1 : 0);

  const leadDisplayName = teamLead
    ? teamLead.full_name || teamLead.email || "Unknown"
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="border-slate-200/80 shadow-sm lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <EntityAvatar name={project.name} size="lg" />
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                {project.name}
              </CardTitle>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                  {project.key}
                </span>
                <Badge variant={project.status}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {project.description?.trim() ||
                "No description provided for this project."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetaTile
              icon={UsersRound}
              label="Team"
              value={project.team?.name ?? "—"}
              subValue={
                leadDisplayName ? `Led by ${leadDisplayName}` : undefined
              }
            />
            <MetaTile
              icon={Calendar}
              label="Start date"
              value={formatDate(project.start_date)}
            />
            <MetaTile
              icon={Calendar}
              label="Due date"
              value={formatDate(project.due_date)}
            />
            <MetaTile
              icon={Calendar}
              label="Created"
              value={formatDate(project.created_at)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-slate-900">
              Team
            </CardTitle>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-slate-500">
              {memberCount}
            </span>
          </div>
          {project.team?.name && (
            <p className="mt-1 text-xs text-slate-400">{project.team.name}</p>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {teamLead && (
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Team lead
              </p>
              {(() => {
                const leadHref = memberProfileHref?.(teamLead.id);
                const leadContent = (
                  <>
                    <EntityAvatar
                      name={leadDisplayName!}
                      size="md"
                      className="ring-2 ring-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={
                            leadHref
                              ? "truncate text-sm font-semibold text-slate-900 hover:text-blue-600"
                              : "truncate text-sm font-semibold text-slate-900"
                          }
                        >
                          {teamLead.full_name || "Unknown"}
                        </p>
                        <TeamLeadBadge />
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {teamLead.email}
                      </p>
                    </div>
                  </>
                );

                return leadHref ? (
                  <Link
                    href={leadHref}
                    className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                  >
                    {leadContent}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">{leadContent}</div>
                );
              })()}
            </div>
          )}

          {otherMembers.length > 0 ? (
            <div className="px-5 py-4">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Members
              </p>
              <ul className="space-y-3">
                {otherMembers.map((member) => {
                  const displayName =
                    member.full_name || member.email || "Unknown";
                  const href = memberProfileHref?.(member.id);
                  return (
                    <li key={member.id}>
                      {href ? (
                        <Link
                          href={href}
                          className="flex items-center gap-3 rounded-lg py-0.5 transition-colors hover:opacity-90"
                        >
                          <EntityAvatar name={displayName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 hover:text-blue-600">
                              {member.full_name || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {member.email}
                            </p>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <EntityAvatar name={displayName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {member.full_name || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : !teamLead ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No members on this team yet.
            </p>
          ) : otherMembers.length === 0 ? (
            <p className="px-5 pb-5 pt-1 text-xs text-slate-400">
              No other members on this team.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/60">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-slate-900">{value}</p>
        {subValue && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{subValue}</p>
        )}
      </div>
    </div>
  );
}
