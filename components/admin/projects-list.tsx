import { ProjectsView } from "@/components/projects/projects-view";
import {
  ProjectListTabs,
  type ProjectListTab,
} from "@/components/shared/project-list-tabs";
import type { PagedResult } from "@/lib/data/queries";
import type { ProjectWithDetails } from "@/types/database";

export function ProjectsList({
  tab,
  search,
  activeCount,
  archivedCount,
  projectsPage,
}: {
  tab: ProjectListTab;
  search: string;
  activeCount: number;
  archivedCount: number;
  projectsPage: PagedResult<ProjectWithDetails>;
}) {
  function tabHref(target: ProjectListTab) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (target === "archived") params.set("tab", "archived");
    const qs = params.toString();
    return qs ? `/admin/projects?${qs}` : "/admin/projects";
  }

  return (
    <div className="space-y-6">
      <ProjectListTabs
        tab={tab}
        activeCount={activeCount}
        archivedCount={archivedCount}
        hrefFor={tabHref}
      />
      <ProjectsView
        projects={projectsPage.items}
        detailPathPrefix="/admin/projects"
        viewStorageKey="taskora-projects-view-admin"
        emptyTitle={tab === "active" ? "No active projects" : "No archived projects"}
        emptyDescription={
          tab === "active"
            ? "Create a project and link it to a team to start tracking work."
            : "Archived projects will appear here."
        }
        adminMode
        pagination={{
          page: projectsPage.page,
          pageSize: projectsPage.pageSize,
          total: projectsPage.total,
        }}
      />
    </div>
  );
}
