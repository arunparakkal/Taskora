# Taskora — Project progress & feature log

This document lists everything built in Taskora from the initial scaffold through current state.

---

## Phase 1 — Core platform

### Database (Supabase)

- **Profiles** — linked to `auth.users`, roles: `admin`, `team_lead`, `member`
- **Teams** — name, description, optional `lead_id`
- **Team members** — many-to-many users ↔ teams
- **Projects** — name, key, team, status (`active` / `archived`)
- **Tasks** — title, description, project, assignee, status, priority, due date
- Row Level Security (RLS) policies per role
- Migrations:
  - `001_initial_schema.sql` — core tables + RLS
  - `002_search_indexes.sql` — search performance
  - `003_team_lead_tasks.sql` — team lead task permissions + `get_team_member_profiles` RPC
  - `004_performance_module.sql` — task activity log, quality counters, snapshots, status-change trigger

### Authentication

- Admin-only user creation (no public signup)
- Login page with email/password
- Server-side session via Supabase SSR cookies
- Middleware protects `/admin`, `/team-lead`, `/member` routes
- Role-based redirects (wrong role → correct home)
- Logout API clears session and role cookie

### App shell

- Dark sidebar navigation with role-specific menus
- Top header (mobile title, notifications placeholder, user menu)
- `PageShell` layout (title, description, stats, actions)
- Empty states, stat cards, data tables with pagination UI
- Entity avatars with consistent colors

---

## Phase 2 — Admin module

### Navigation (6 items)

| Item | Route |
|------|-------|
| Dashboard | `/admin` |
| Users | `/admin/users` |
| Teams | `/admin/teams` |
| Projects | `/admin/projects` |
| Tasks | `/admin/tasks` |
| Performance | `/admin/performance` |

### Dashboard (`/admin`)

- Welcome stats: users, teams, projects, tasks
- Task pipeline bars by status
- Users-by-role breakdown
- Unassigned / overdue alerts
- Recent users table
- Recent tasks table
- Quick action links
- Loading skeleton

### Users (`/admin/users`)

- Stats: total, admins, team leads, members
- Search by name, email, role
- **Create user** dialog
- **Edit user** dialog (name, email, role, optional password)
- **Delete user** with confirmation
- Rules: cannot edit/delete admin accounts; cannot delete self or last admin
- Optimized table layout (no horizontal scroll)
- Performance: cached list, loading skeleton, Suspense streaming

### Teams (`/admin/teams`)

- Stats: total teams, members, leads, created this month
- Search teams
- **Create team** dialog (team lead = team_lead role only)
- **View / manage members** dialog
- **Delete team** via ⋮ menu + confirmation
- Rules: admins excluded from member picker; only team_lead can be assigned as lead

### Projects (`/admin/projects`)

- Create project (auto key from name)
- List with team, status, task count
- Search by name, key, or team
- **View details** link per project → `/admin/projects/[id]`

### Project details (`/admin/projects/[id]`)

- Project info: name, key, description, status, team, created date
- **Project summary**: completion %, task pipeline, overdue/unassigned alerts
- Team members list
- Task stats (total, open, in review, done)
- Full tasks table with inline status updates
- **Add task** pre-filled for this project
- Link to filtered tasks page

### Tasks (`/admin/tasks`)

- Create task dialog (sticky footer, scroll body)
- Filters: project, assignee, status
- Inline status dropdown
- Priority and status badges (no line-wrap on “In Progress”)
- Compact table (project merged into task cell)

### Global search

- Admin header search across users, teams, projects, tasks

### Performance (`/admin/performance`)

- Organization-wide scoring across all teams and non-admin users
- **Team overview** table — avg score, excellent/at-risk counts per team
- **Top performers** leaderboard with role badges
- Filter by team + period (week / month / quarter)
- Per-member score breakdown cards

---

## Phase 3 — Team Lead module

### Navigation (5 items)

| Item | Route |
|------|-------|
| Dashboard | `/team-lead` |
| My Projects | `/team-lead/projects` |
| Team Tasks | `/team-lead/tasks` |
| My Team | `/team-lead/team` |
| Performance | `/team-lead/performance` |

### Dashboard (`/team-lead`)

- Scoped stats for teams the user leads
- Task pipeline, alerts (review / unassigned / overdue)
- **Team capacity** snapshot (top available members)
- **Review queue** with **Approve** / **Request changes** buttons (`ReviewActions`)
- Recent team tasks

### Projects

- List team projects with stats
- **View details** link per project → `/team-lead/projects/[id]`
- **Project detail** — info card, **project summary** (progress, pipeline, alerts),
  team members, task stats, tasks table, **Add Task** button (if team lead)
- Create task API with lead permission checks

### Team Tasks

- Full task list for lead’s teams
- Status updates via dropdown

### My Team + workload system

- Per-member workload calculation (`lib/workload/member-workload.ts`):
  - Weights: status, priority, overdue, due-this-week
  - Capacity default: 5 active tasks (`in_progress` + `review`)
  - Status bands: Available · Moderate · At capacity · Overloaded
- Team table: active/open/overdue, slots free, workload badge
- Members sorted by availability

### Add Task — smart assignment

- Suggested assignee (most available member)
- Assignee list sorted by workload
- Workload badge per option

### Performance (`/team-lead/performance`)

- Team average, excellent, at-risk, and completed-task stats
- **Top Performers** leaderboard for led teams
- Per-member score breakdown cards
- Period filter: This Week / This Month / Last 3 Months

---

## Phase 4 — Member module

### Navigation (2 items)

| Item | Route |
|------|-------|
| My Tasks | `/member/tasks` |
| My Performance | `/member/performance` |

### My Tasks (`/member/tasks`)

- View assigned tasks
- Update status on own tasks (move to Review when work is complete)

### My Performance (`/member/performance`)

- Personal score ring out of 100
- Pillar breakdown: Quality, Delivery, Productivity, Reliability, Collaboration
- Performance level label (Excellent → At Risk)
- Period filter: This Week / This Month / Last 3 Months

---

## Phase 5 — Auth & session hardening

- Login/logout API routes (server-set cookies)
- Per-tab session sync (`sessionStorage` + `BroadcastChannel`)
- On role mismatch across tabs → logout + redirect to login
- Role cookie (`taskora_role`) for faster middleware (JWT → cookie → DB fallback)
- Documented limitation: one cookie per browser profile

---

## Phase 6 — UI / UX polish

- Task status labels: “To Do”, “In Progress”, “Review”, “Done”
- `whitespace-nowrap` on status badges and selects
- Dialog forms: `overflow-x-hidden`, sticky footers, visible primary buttons
- Admin users table: icon edit/delete, merged user+email column
- Team lead create task: blue submit button always visible
- Hydration fixes: sidebar as client component, pathname passed to header
- Mobile page titles for all team-lead routes

---

## Phase 7 — Performance

- `React.cache()` on `createClient` and `getCurrentProfile`
- Slim admin dashboard queries (`getAdminDashboardStats`)
- Admin role layouts passthrough (no duplicate profile fetch)
- `unstable_cache` for user list + `revalidateTag` on user CRUD
- `admin/users/loading.tsx` skeleton
- Users page `Suspense` boundary
- Sidebar link prefetch

---

## Phase 8 — Performance module (detailed)

### Goal

Build a fair, production-style performance system that does **not** rank people
only by task count. Every member gets a score out of **100** with a transparent
breakdown across five pillars.

Design principles:
- Quality outweighs speed (35-point pillar)
- Finishing early gives only a small bonus
- Productivity uses priority-weighted throughput, judged relative to peers
- Every score shown includes a breakdown so users know where to improve

### Database — `supabase/migrations/004_performance_module.sql`

**New columns on `tasks`:**

| Column | Purpose |
|--------|---------|
| `completed_at` | When the task was first marked Done (Delivery scoring) |
| `review_cycles` | Times work was sent back from Review → In Progress |
| `reopened_count` | Times a Done task was reopened (quality/reliability hit) |

**New table: `task_activity`**
- Logs every status change: `task_id`, `actor_id`, `from_status`, `to_status`,
  `action`, `comment`, `created_at`
- Actions: `status_changed`, `approved`, `changes_requested`, `reopened`

**New table: `performance_snapshots`**
- Reserved for future stored period scores and trend graphs
- Columns: user, team, period type/start/end, pillar scores, overall, metadata

**Trigger: `handle_task_status_change` (BEFORE UPDATE on `tasks`)**
- `review → in_progress` → `review_cycles + 1`
- `done → anything else` → `reopened_count + 1`, clears `completed_at`
- First time entering `done` → sets `completed_at = NOW()`
- Inserts a row into `task_activity` on every status change
- Backfill: existing Done tasks get `completed_at = created_at`

**RLS**
- `task_activity` and `performance_snapshots` readable by admin, assignee, and
  team lead

### Scoring engine — `lib/performance/calculate-performance.ts`

**Overall formula (100 points):**

| Pillar | Weight | How it is calculated |
|--------|--------|----------------------|
| **Quality** | 35 | First-pass approval = 100%; 1 review cycle = 85%; 2+ = 70%; each reopen deducts up to 25% |
| **Delivery** | 25 | 2+ days early = 100%; on due date = 95%; 1–3 days late = 70%; 4–7 days = 50%; 8+ = 25% |
| **Productivity** | 20 | Priority-weighted completed tasks (low=1, medium=2, high=3, urgent=4), compared to team/org average |
| **Reliability** | 15 | Starts at 100; deducts for overdue open tasks, late completions, reopens, stale in-progress work (14+ days) |
| **Collaboration** | 5 | Placeholder at 75% until comments/reviews are wired in |

**Performance levels:**

| Score | Level |
|-------|-------|
| 90–100 | Excellent |
| 80–89 | Very Good |
| 70–79 | Good |
| 60–69 | Needs Improvement |
| Below 60 | At Risk |

**Periods** — `lib/performance/periods.ts`
- **This Week** — rolling last 7 days
- **This Month** — rolling last 30 days
- **Last 3 Months** — rolling last 90 days

Only tasks **completed within the selected period** count heavily for Quality,
Delivery, and Productivity. Reliability also considers currently open/overdue
work.

### Data layer — `lib/data/performance.ts`

| Function | Who uses it | Scope |
|----------|-------------|-------|
| `getTeamLeadPerformance(userId, period)` | Team Lead | Only teams the lead manages |
| `getAdminPerformance(period, teamId?)` | Admin | Entire organization; optional team filter |
| `getMemberSelfPerformance(userId, period)` | Member | Own assigned tasks only |

**Who gets scored:**
- Members and Team Leads (`canJoinTeam` — admins are excluded)
- Must be on a team roster **or** have assigned tasks

**Admin stat card meanings:**
- **Org Average** — average of all individual overall scores in the org for the
  period (not a percentage; e.g. 71 = average person scored 71/100)
- **Excellent** — **count** of people scoring **90+** (e.g. Excellent: 2 = two
  people rated Excellent)
- **At Risk** — count of people scoring **below 60**
- **Teams** — number of teams with at least one scored member

**Team Lead stat card meanings:**
- **Team Average** — same as Org Average but scoped to led teams only

**Team overview table (admin only):**
- Per-team average score, member count, excellent count, at-risk count

### UI pages & routes

| Role | Route | What it shows |
|------|-------|---------------|
| Admin | `/admin/performance` | Org stats, team overview table, top performers (with role badges), team + period filters, per-member breakdown cards |
| Team Lead | `/team-lead/performance` | Team average, excellent/at-risk stats, top performers, period filter, per-member breakdown |
| Member | `/member/performance` | Personal score ring, pillar bars, level label, period filter |

**Navigation added:**
- Admin sidebar: **Performance** (Gauge icon)
- Team Lead sidebar: **Performance**
- Member sidebar: **My Performance**
- Mobile header titles updated for all three routes

### UI components — `components/performance/`

| Component | Purpose |
|-----------|---------|
| `PerformanceCard` | Score ring (0–100) + pillar progress bars + stats (completed, on-time, first-pass, overdue open) |
| `PerformanceLevelBadge` | Colored badge: Excellent / Very Good / Good / Needs Improvement / At Risk |
| `TopPerformers` | Ranked leaderboard table; optional `showRole` for admin view |
| `PeriodFilter` | Client-side tabs: This Week / This Month / Last 3 Months |
| `TeamFilter` | Admin dropdown to filter by team or show all teams |
| `TeamPerformanceTable` | Admin team comparison table |

### Review workflow — quality data source

**Component:** `components/tasks/review-actions.tsx`

On the Team Lead dashboard **Review queue**, leads see:
- **Approve** → sets status to `Done` (logged as `approved` in `task_activity`)
- **Request changes** → sets status to `In Progress` (logged as
  `changes_requested`, increments `review_cycles`)

This feeds accurate **Quality** and **Reliability** scores instead of a generic
status dropdown.

### TypeScript types — `types/database.ts`

Added types for:
- Extended `Task` (`completed_at`, `review_cycles`, `reopened_count`)
- `TaskActivity`, `TaskActivityAction`
- `PerformanceSnapshot`

### Files created / modified (Performance module)

**New files:**
- `supabase/migrations/004_performance_module.sql`
- `lib/performance/calculate-performance.ts`
- `lib/performance/periods.ts`
- `lib/data/performance.ts`
- `app/(dashboard)/admin/performance/page.tsx`
- `app/(dashboard)/team-lead/performance/page.tsx`
- `app/(dashboard)/member/performance/page.tsx`
- `components/performance/performance-card.tsx`
- `components/performance/performance-level-badge.tsx`
- `components/performance/top-performers.tsx`
- `components/performance/period-filter.tsx`
- `components/performance/team-filter.tsx`
- `components/performance/team-performance-table.tsx`
- `components/tasks/review-actions.tsx`

**Modified files:**
- `types/database.ts`
- `components/layout/sidebar.tsx` — Performance nav for all roles
- `components/layout/top-header.tsx` — page titles
- `app/(dashboard)/team-lead/page.tsx` — ReviewActions on review queue
- `README.md` — feature docs

### Setup required

Run migration `004_performance_module.sql` in Supabase (SQL editor or
`supabase db push`) before scores reflect real quality/delivery data from
reviews.

---

## API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/login` | POST | Sign in, set role cookie |
| `/api/auth/logout` | POST | Sign out, clear role cookie |
| `/api/admin/users` | POST | Create user |
| `/api/admin/users/[id]` | PATCH, DELETE | Edit / delete user |
| `/api/admin/teams` | POST | Create team |
| `/api/admin/teams/[id]` | DELETE | Delete team |
| `/api/admin/teams/[id]/members` | POST | Set team members |
| `/api/admin/projects` | POST | Create project |
| `/api/admin/tasks` | POST, PATCH | Create / update task |
| `/api/admin/search` | GET | Global search |
| `/api/team-lead/tasks` | POST | Create task (team lead) |

---

## Task status workflow

```
To Do → In Progress → Review → Done
                         ↑
              Team lead reviews here
```

- **Member** moves task to Review when work is complete; members cannot set a
  task to Done themselves (`TaskStatusSelect` hides Done in `mode="member"`,
  enforced again server-side in `/api/admin/tasks` PATCH)
- **Team lead** (or admin) moves Review → Done (**Approve**) or back to
  In Progress (**Request changes**, reason required)
- Each transition is recorded in `task_activity` and updates the quality
  counters used by the performance module

### Review + notifications (migration `005_notifications.sql`)

- `review_task(task_id, decision, comment)` — Postgres RPC used by
  `ReviewActions`/`/api/tasks/review`. Atomically: updates task status,
  attaches the reviewer's comment to the `task_activity` row created by the
  004 trigger, and inserts a row in `notifications` for the assignee.
- **Request changes** now opens a dialog requiring a written reason before
  sending the task back to In Progress — the member sees this exact reason.
- `notifications` table: `recipient_id`, `actor_id`, `task_id`, `type`
  (`task_approved` / `task_rejected` / `task_reopened`), `title`, `message`,
  `is_read`. RLS: a user can only read/update their own notifications.
- `components/layout/notification-bell.tsx` — Instagram-style bell dropdown
  in the top header (polls `/api/notifications` every 30s), with colored
  icon-badge avatars (emerald = approved, amber = changes requested, orange =
  reopened), unread dot/tint, and an expandable row showing the full reason,
  reviewer, and exact timestamp.
- `/admin/notifications`, `/team-lead/notifications`, `/member/notifications`
  — full history page (same expandable rows, "mark all as read").

---

## Not yet implemented (future ideas)

- Task detail page with comments (activity log now captured in `task_activity`)
- Stored performance snapshots + trend graphs (table exists, capture job pending)
- Story points / task difficulty for richer productivity scoring
- Dynamic collaboration pillar (comments, reviews given)
- Email notifications (in-app notifications shipped — see review workflow above)
- Kanban board view
- Task filters on team lead tasks page
- Bulk task actions
- Pagination on large lists
- Sprint / cycle planning
- Full RLS audit as sole security boundary (API checks exist today)

---

## Recovery notes

If files were lost (e.g. accidental undo), the project was recovered from:
- `.next` source maps (`scripts/recover-from-next.mjs`)
- Agent transcript extracts (`scripts/extract-missing.mjs`)

---

*Last updated: full Performance module documentation (Admin org-wide, Team Lead, Member), review workflow, workload system, admin team delete, user edit rules, and navigation performance optimizations.*
