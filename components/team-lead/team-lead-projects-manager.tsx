"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowUpDown,
  Calendar,
  Clock,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { MemberAvatarStack } from "@/components/team-lead/member-avatar-stack";
import {
  ArchiveProjectDialog,
  CreateTeamLeadProjectDialog,
  EditTeamLeadProjectDialog,
} from "@/components/team-lead/team-lead-project-dialogs";
import { ProjectProgressBar } from "@/components/projects/project-progress-bar";
import {
  ProjectListTabs,
  splitProjectsByArchive,
  type ProjectListTab,
} from "@/components/shared/project-list-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/status";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Team, TeamLeadProjectItem } from "@/types/database";

type SortKey = "last_updated" | "name" | "due_date" | "progress";
type StatusFilter = "all" | "active" | "paused";

export function TeamLeadProjectsManager({
  projects,
  teams,
}: {
  projects: TeamLeadProjectItem[];
  teams: Team[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<ProjectListTab>("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("last_updated");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<TeamLeadProjectItem | null>(null);
  const [archiveProject, setArchiveProject] = useState<TeamLeadProjectItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { active: activeProjects, archived: archivedProjects } =
    splitProjectsByArchive(projects);
  const pool = tab === "active" ? activeProjects : archivedProjects;

  const filtered = useMemo(() => {
    let list = [...pool];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (tab === "active" && statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "due_date":
          return (a.due_date ?? "").localeCompare(b.due_date ?? "");
        case "progress":
          return (b.completion_rate ?? 0) - (a.completion_rate ?? 0);
        default:
          return b.last_updated.localeCompare(a.last_updated);
      }
    });
    return list;
  }, [pool, query, sort, statusFilter, tab]);

  async function handleArchive() {
    if (!archiveProject) return;
    setActionLoading(true);
    const res = await fetch(`/api/team-lead/projects/${archiveProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    const json = await res.json();
    setActionLoading(false);

    if (!res.ok) {
      toast({ title: "Error", description: json.error, variant: "destructive" });
      return;
    }

    toast({
      title: "Project archived",
      description: `${archiveProject.name} moved to Archived.`,
      variant: "success",
    });
    setArchiveProject(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your team&apos;s projects.</p>
        </div>
        {tab === "active" && (
          <Button
            className="gap-2 shadow-sm"
            onClick={() => setCreateOpen(true)}
            disabled={teams.length === 0}
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        )}
      </div>

      <ProjectListTabs
        tab={tab}
        onTabChange={setTab}
        activeCount={activeProjects.length}
        archivedCount={archivedProjects.length}
      />

      <Card className="border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="h-10 border-slate-200 bg-slate-50 pl-10"
            />
          </div>
          {tab === "active" && (
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-10 w-full lg:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-10 w-full lg:w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_updated">Last Updated</SelectItem>
              <SelectItem value="name">Project Name</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            {tab === "active" ? (
              <FolderKanban className="h-7 w-7 text-slate-400" />
            ) : (
              <Archive className="h-7 w-7 text-slate-400" />
            )}
          </div>
          {tab === "active" ? (
            <>
              <h3 className="text-lg font-semibold text-slate-900">No active projects.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Create a project to start managing your team.
              </p>
              {teams.length > 0 && (
                <Button className="mt-6 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Project
                </Button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-slate-900">No archived projects.</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Archived projects appear here. Contact an admin to unarchive.
              </p>
            </>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project) =>
            tab === "archived" ? (
              <ArchivedProjectRow key={project.id} project={project} />
            ) : (
              <ActiveProjectRow
                key={project.id}
                project={project}
                onEdit={() => setEditProject(project)}
                onArchive={() => setArchiveProject(project)}
              />
            )
          )}
        </div>
      )}

      <CreateTeamLeadProjectDialog
        teams={teams}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {editProject && (
        <EditTeamLeadProjectDialog
          project={editProject}
          open={!!editProject}
          onOpenChange={(o) => !o && setEditProject(null)}
        />
      )}
      {archiveProject && (
        <ArchiveProjectDialog
          projectName={archiveProject.name}
          open={!!archiveProject}
          onOpenChange={(o) => !o && setArchiveProject(null)}
          onConfirm={() => void handleArchive()}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

function ActiveProjectRow({
  project,
  onEdit,
  onArchive,
}: {
  project: TeamLeadProjectItem;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Card className="border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ProjectRowBody project={project} />
        <ProjectMenu
          onView={`/team-lead/projects/${project.id}`}
          onEdit={onEdit}
          onManageMembers="/team-lead/team"
          onArchive={onArchive}
          archived={false}
        />
      </div>
    </Card>
  );
}

function ArchivedProjectRow({ project }: { project: TeamLeadProjectItem }) {
  return (
    <Card className="border-slate-200 bg-slate-50/60 p-5 shadow-sm opacity-90">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ProjectRowBody project={project} muted />
        <ProjectMenu
          onView={`/team-lead/projects/${project.id}`}
          archived
        />
      </div>
    </Card>
  );
}

function ProjectRowBody({
  project,
  muted = false,
}: {
  project: TeamLeadProjectItem;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {muted && <Archive className="h-4 w-4 text-slate-400" />}
        <Link
          href={`/team-lead/projects/${project.id}`}
          className={`text-lg font-semibold hover:text-blue-600 ${
            muted ? "text-slate-700" : "text-slate-900"
          }`}
        >
          {project.name}
        </Link>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
          {project.key}
        </span>
        <Badge variant={project.status}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-sm text-slate-500">{project.description}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Meta icon={Users} label="Team">
          <MemberAvatarStack members={project.members} />
        </Meta>
        <Meta icon={FolderKanban} label="Tasks">
          {project.done_count ?? 0} / {project.task_count ?? 0} completed
        </Meta>
        <Meta icon={Calendar} label="Due date">
          {formatDate(project.due_date)}
        </Meta>
        <Meta icon={Clock} label="Last updated">
          {formatDateTime(project.last_updated)}
        </Meta>
      </div>
      <div className="max-w-md">
        <ProjectProgressBar
          rate={project.completion_rate ?? 0}
          done={project.done_count}
          total={project.task_count}
          compact={muted}
        />
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}

function ProjectMenu({
  onView,
  onEdit,
  onManageMembers,
  onArchive,
  archived,
}: {
  onView: string;
  onEdit?: () => void;
  onManageMembers?: string;
  onArchive?: () => void;
  archived: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
          aria-label="Project actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={onView}>View Project</Link>
        </DropdownMenuItem>
        {!archived && onEdit && (
          <DropdownMenuItem onSelect={onEdit}>Edit Project</DropdownMenuItem>
        )}
        {!archived && onManageMembers && (
          <DropdownMenuItem asChild>
            <Link href={onManageMembers}>Manage Members</Link>
          </DropdownMenuItem>
        )}
        {!archived && onArchive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onArchive}>Archive Project</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
