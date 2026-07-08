"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Search,
  Users as UsersIcon,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/layout/dashboard-shell";
import { ManageTeamMembersDialog } from "@/components/admin/manage-team-members-dialog";
import { TeamActionsMenu } from "@/components/admin/team-actions-menu";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { DataTableCard } from "@/components/shared/data-table-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Profile, TeamWithDetails } from "@/types/database";

type TeamRow = TeamWithDetails & {
  memberIds: string[];
};

function matchesTeam(team: TeamRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    team.name.toLowerCase().includes(q) ||
    (team.description?.toLowerCase().includes(q) ?? false) ||
    (team.lead?.full_name?.toLowerCase().includes(q) ?? false)
  );
}

export function TeamsList({
  teams,
  users,
}: {
  teams: TeamRow[];
  users: Profile[];
}) {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  const filteredTeams = useMemo(
    () => teams.filter((team) => matchesTeam(team, query)),
    [teams, query]
  );

  const userTeams = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    for (const team of teams) {
      for (const uid of team.memberIds) {
        (map[uid] ??= []).push({ id: team.id, name: team.name });
      }
    }
    return map;
  }, [teams]);

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No teams yet"
        description="Create a team and add members to organize your work."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams by name, description, or lead..."
            className="h-10 border-slate-200 bg-slate-50 pl-10"
          />
        </div>
      </Card>

      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No teams found"
          description={`No teams match "${query}". Try a different search.`}
        />
      ) : (
        <DataTableCard total={filteredTeams.length}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Team</TableHead>
                <TableHead>Team Lead</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={team.name} />
                      <div>
                        <p className="font-semibold text-slate-900">{team.name}</p>
                        <p className="text-xs text-slate-500">
                          {team.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.lead ? (
                      <div className="flex items-center gap-2">
                        <EntityAvatar
                          name={team.lead.full_name || team.lead.email}
                          size="sm"
                        />
                        <span className="text-slate-700">{team.lead.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <UsersIcon className="h-4 w-4 text-slate-400" />
                      {team.memberIds.length}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(team.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ManageTeamMembersDialog
                        teamId={team.id}
                        teamName={team.name}
                        allUsers={users}
                        currentMemberIds={team.memberIds}
                        userTeams={userTeams}
                      />
                      <TeamActionsMenu
                        teamId={team.id}
                        teamName={team.name}
                        memberCount={team.memberIds.length}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableCard>
      )}
    </div>
  );
}
