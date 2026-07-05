# Taskora

Jira-like project management platform built with **Next.js 16** and **Supabase**. Admin-only user provisioning, role-based dashboards, teams, projects, tasks, and team workload visibility.

## Quick start

1. Create a [Supabase](https://supabase.com) project
2. Run migrations in order (SQL Editor):
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_search_indexes.sql`
   - `supabase/migrations/003_team_lead_tasks.sql`
3. Copy `.env.local.example` → `.env.local` and fill in Supabase keys
4. Create first user in Supabase Auth, then set role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```
5. `npm install && npm run dev` → [http://localhost:3000](http://localhost:3000)

See [`docs/PROJECT_PROGRESS.md`](docs/PROJECT_PROGRESS.md) for the full feature list and implementation notes.

---

## Roles

| Role | Home route | Purpose |
|------|------------|---------|
| **Admin** | `/admin` | Full org management |
| **Team Lead** | `/team-lead` | Lead teams, assign tasks, review work |
| **Member** | `/member/tasks` | Work on assigned tasks |

**Business rules**
- Only admins can create user accounts (no public signup)
- Admins are **not** shown as team members or team leads
- Admin accounts **cannot be edited** from the Users page
- Team leads can only manage tasks for projects on teams they lead

---

## Features by role

### Admin

**Dashboard** (`/admin`)
- Stats: users, teams, projects, tasks
- Task pipeline (To Do → In Progress → Review → Done)
- Alerts for unassigned and overdue tasks
- Recent users and recent tasks
- Quick actions and stat-card links (prefetched)

**Users** (`/admin/users`)
- List, search, and filter users
- Create user (email, password, name, role)
- Edit user (name, email, role, optional password) — not for admin accounts
- Delete user (with confirmation; cannot delete self or last admin)
- Role stats: admins, team leads, members
- Cached user list + loading skeleton for faster navigation

**Teams** (`/admin/teams`)
- Create teams (name, description, optional team lead)
- Search teams
- View / manage team members (team leads and members only — admins excluded)
- Delete team (⋮ menu → confirmation; cascades projects/tasks)
- Team lead dropdown: team leads only (not admins)

**Projects** (`/admin/projects`)
- Create projects (name, key, team, description)
- List with team, status, task counts

**Tasks** (`/admin/tasks`)
- Create tasks (title, project, assignee, priority, due date, description)
- Filter by project, assignee, status
- Update status inline
- Layout optimized: no horizontal scroll, merged project column

**Global search** (admin header)
- Search users, teams, projects, tasks

**Performance** (`/admin/performance`)
- Organization-wide scoring across all teams and members (excludes admin accounts)
- **Team overview** table — avg score, excellent/at-risk counts per team
- **Top performers** leaderboard with role badges
- Filter by team and period (This Week / This Month / Last 3 Months)
- Per-member score breakdown cards

---

### Team Lead

**Dashboard** (`/team-lead`)
- Team stats: teams, projects, tasks, in-review count
- Task pipeline for team scope
- Alerts: in review, unassigned, overdue
- **Team capacity** widget — who has availability
- Review queue with inline status updates
- Recent team tasks

**My Projects** (`/team-lead/projects`)
- Projects for teams the lead belongs to
- Stats: project count, active, team tasks, open tasks
- Project detail page with tasks and team members

**Team Tasks** (`/team-lead/tasks`)
- All tasks across lead’s teams
- Update status, view assignee, priority, due dates

**My Team** (`/team-lead/team`)
- Teams the user leads
- **Workload / capacity per member**:
  - Active tasks vs capacity (default 5)
  - Open, overdue, slots free
  - Status: Available · Moderate · At capacity · Overloaded
- Members sorted by availability

**Add Task** (project detail)
- Create tasks for projects on teams they lead
- **Suggested assignee** based on workload
- Assignee dropdown sorted by availability with workload badges

**Performance** (`/team-lead/performance`)
- Multi-factor scoring out of 100 (Quality, Delivery, Productivity, Reliability, Collaboration)
- **Top Performers** leaderboard with rank, level, completion & on-time rates
- Per-member breakdown cards, filter by This Week / This Month / Last 3 Months

**Task workflow**
- **Review** = member finished work; team lead **Approves** or **Requests changes**
- Every transition is logged and feeds the quality/reliability scores

---

### Member

**My Tasks** (`/member/tasks`)
- View assigned tasks
- Update status on own tasks

**My Performance** (`/member/performance`)
- Personal score ring with a transparent pillar breakdown
- Rated Excellent → At Risk for the selected period

---

## Task model

| Field | Values |
|-------|--------|
| **Status** | To Do · In Progress · **Review** · Done |
| **Priority** | Low · Medium · High · Urgent |

**Review** means work is ready for team lead approval before marking Done.

---

## Authentication & sessions

- Login / logout via API routes with HTTP-only cookies
- Middleware enforces role-based route access
- Role cached in `taskora_role` cookie (set on login) for faster navigation
- Per-tab session binding (`sessionStorage` + `BroadcastChannel`) to reduce cross-tab role confusion
- **Note:** One browser profile = one shared cookie. Use separate profiles or incognito to test multiple roles simultaneously.

---

## Performance

- `React.cache()` on Supabase client and profile fetch
- Cached admin user list (`unstable_cache`, 60s, invalidated on user CRUD)
- Route-level loading skeletons (`admin/loading.tsx`, `admin/users/loading.tsx`)
- Users page wrapped in `Suspense` for streaming
- Link prefetch on sidebar and stat cards
- Middleware skips DB role lookup when JWT/cookie has role

---

## Tech stack

- Next.js 16 (App Router, Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui-style components
- Supabase (Auth, Postgres, RLS)
- React Hook Form + Zod validation

---

## Project structure (high level)

```
app/
  (auth)/login/          Login page
  (dashboard)/
    admin/               Admin pages
    team-lead/           Team lead pages
    member/              Member pages
  api/                   Auth + CRUD API routes
components/
  admin/                 Admin dialogs, lists, filters
  team-lead/             Team lead task creation
  layout/                Sidebar, shell, header, search
  shared/                Badges, avatars, workload UI
lib/
  auth/                  Roles, profile, role cookie
  data/                  Queries, dashboard stats, team-lead data
  workload/              Member workload calculator
supabase/migrations/     SQL schema + RPCs
```

---

## Documentation

- [`docs/PROJECT_PROGRESS.md`](docs/PROJECT_PROGRESS.md) — Detailed feature changelog and setup notes
