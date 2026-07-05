"use client";

import { ProjectsView } from "@/components/projects/projects-view";
import type { ProjectWithDetails } from "@/types/database";

export function ProjectsList({ projects }: { projects: ProjectWithDetails[] }) {
  return (
    <ProjectsView
      projects={projects}
      detailPathPrefix="/admin/projects"
      viewStorageKey="taskora-projects-view-admin"
      emptyTitle="No projects yet"
      emptyDescription="Create a project and link it to a team to start tracking work."
      adminMode
    />
  );
}
