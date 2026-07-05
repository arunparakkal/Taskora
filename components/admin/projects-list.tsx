"use client";

import { useState } from "react";
import { ProjectsView } from "@/components/projects/projects-view";
import {
  ProjectListTabs,
  splitProjectsByArchive,
  type ProjectListTab,
} from "@/components/shared/project-list-tabs";
import type { ProjectWithDetails } from "@/types/database";

export function ProjectsList({ projects }: { projects: ProjectWithDetails[] }) {
  const [tab, setTab] = useState<ProjectListTab>("active");
  const { active, archived } = splitProjectsByArchive(projects);
  const pool = tab === "active" ? active : archived;

  return (
    <div className="space-y-6">
      <ProjectListTabs
        tab={tab}
        onTabChange={setTab}
        activeCount={active.length}
        archivedCount={archived.length}
      />
      <ProjectsView
        projects={pool}
        detailPathPrefix="/admin/projects"
        viewStorageKey="taskora-projects-view-admin"
        emptyTitle={tab === "active" ? "No active projects" : "No archived projects"}
        emptyDescription={
          tab === "active"
            ? "Create a project and link it to a team to start tracking work."
            : "Archived projects will appear here."
        }
        adminMode
      />
    </div>
  );
}
