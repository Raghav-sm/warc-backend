# Warc Analytics — Project Plan

## 1. Overview

Warc Analytics is a task/project management platform. Users belong to a single flat workspace (no multi-organization layer) and are added to individual **Projects**. Each project contains **Tasks**, which can be simple (manually tracked progress) or checklist-based (progress auto-derived from weighted subtasks). Progress rolls up from subtask → task → project using an assigner-defined weighting system, giving an accurate, non-naive completion percentage rather than a simple "done/total" count.

A personal, Notion-style **Notes** section is planned as a separate feature (Phase 2 of the broader roadmap, not part of this build plan).

---

## 2. Core Concepts

### 2.1 Structure

```
Platform (single workspace)
 └── Users
 └── Roles (custom, permission-flag based)
 └── Projects
      └── Project Members (users added to a project)
      └── Tasks (type: simple | checklist)
           └── Assignees (multiple per task)
           └── Subtasks (only for checklist-type tasks)
           └── Comments
           └── Attachments
           └── Activity Log
           └── Time Logs
           └── Dependencies (blocks / blocked-by)
 └── Notifications
```

### 2.2 Roles & Permissions

Roles are **not hardcoded**. A Role is a name + a set of permission flags, so new roles can be created without code changes.

Default roles shipped: **Admin**, **Manager**, **Dev**, **Viewer** — but any admin can create custom roles and toggle individual permissions.

Permission groups:
- **Projects** — create, delete, edit settings
- **Tasks** — create, edit own, edit any, delete, assign, change status
- **Members** — invite, remove, manage roles
- **Notes** — personal by default, no permission needed (Phase 2)

> **⚠️ Known Gap:** In the current schema, `Role` is a single **global** field directly on `User` (`User.roleId`). This does not support project-level role overrides (e.g. a user being "Manager" on Project A but "Dev" on Project B), which is part of the intended design. Fixing this requires introducing a `ProjectMember` join table that carries its own role reference per project, rather than relying solely on `User.roleId`. **This gap is flagged but intentionally not fixed as part of this plan — to be handled separately.**

### 2.3 Progress & Weighting Model

Progress is not a flat "done/total" ratio. It's a **weighted rollup**:

```
Project Progress % = Σ (Task Weight × Task Progress %) / 100

Task Progress % =
  - Simple task:     manually set by assignee (assigner can override)
  - Checklist task:  Σ (Subtask Weight × Subtask Complete[0 or 100]) / 100

Task Status = auto-derived from Task Progress %
  0%      → Todo
  1–99%   → In Progress
  100%    → Done
  (manually override-able — e.g. reopening a "Done" task resets it to In Progress)
```

**Weighting rules:**
- Task weights within a project **must sum to exactly 100** — save is blocked until they do, with a live "remaining %" indicator shown in the UI.
- Subtask weights within a checklist task **must also sum to exactly 100**, same enforcement.
- Only the task's creator/assigner can convert a task between simple ↔ checklist type, or add/remove subtasks.
- Assignees update progress as they complete work; assigners retain override rights.

---

## 3. Feature Set

### 3.1 In Scope for This Build

| # | Feature | Description |
|---|---|---|
| — | Core CRUD | Projects, Tasks, Subtasks, custom Roles & Permissions |
| — | Weighted Progress | Full rollup model described above |
| 1 | **Notifications** | In-app notifications triggered by: task assignment, task overdue, comment added on your task, `@mention` in a comment, status change on a watched task |
| 2 | **Real-time updates** | WebSocket/SSE-based live updates — board changes, live notification delivery, no manual refresh needed |
| 3 | **Time tracking** | Start/stop timer per task, manual time-log entries, time spent vs estimated, aggregated per task and per project |
| 4 | **Task dependencies** | "Blocks" / "blocked by" relationships between tasks, with circular dependency detection on save |
| 5 | **Global search** | Search across task titles/descriptions, project names, and comments |
| 7 | **File attachments** | Upload/download/delete files on tasks and comments (S3/Supabase storage, presigned URLs) |
| 8 | **Trash / soft-delete UI** | Exposes existing `deletedAt` soft-delete pattern as an actual Trash view — restore or permanently delete |
| 10 | **Command palette (Cmd+K)** | Quick navigation and actions — jump to project/task, create task, go to dashboard |

### 3.2 Explicitly Deferred (Not This Build)

| Feature | Reason |
|---|---|
| **Analytics / reporting view** | Burndown charts, workload-per-person, velocity, overdue trends — the feature that most directly justifies the "Analytics" name, but deliberately deferred until core product is stable and time-tracking data exists to feed it |
| **Invite flow + email verification** | Full invite-link → set password → join flow. `emailVerified` field already exists on `User` but the flow itself is deferred |

### 3.3 Not Part of This Plan

- **Notes (Notion-style personal notes)** — separate feature track, to be scoped later, not included in this project plan.

---

## 4. Schema Additions Required

The current schema (`User`, `Role`, `RefreshToken`, `AuditLog`) is retained as-is. The following models need to be added to support the feature set above:

- `Project` — name, description, ownerId, status (active/archived), timestamps, `deletedAt`
- `ProjectMember` — userId, projectId, joinedAt *(join table; needed even before per-project role override is solved — see flagged gap above)*
- `Task` — title, description, type (simple/checklist), weight, progress, status, priority, dueDate, projectId, createdById, timestamps, `deletedAt`
- `TaskAssignee` — join table, taskId + userId (supports multiple assignees)
- `Subtask` — taskId, title, weight, isComplete
- `Comment` — taskId, authorId, body, timestamps
- `Attachment` — taskId or commentId, fileUrl, fileName, fileType, size, uploadedById
- `TaskDependency` — self-relation on Task (taskId, dependsOnTaskId) for blocks/blocked-by
- `TimeLog` — taskId, userId, startedAt, endedAt, durationMinutes, note
- `Notification` — userId, type, entityType, entityId, message, isRead, createdAt

---

## 5. Screens

| Screen | Purpose |
|---|---|
| **My Dashboard** | Project cards with progress bars (for projects I'm in) + "My Tasks" widget summarizing assignments across all projects |
| **Projects** | Full list of projects I belong to |
| **Project Detail** | Board view (Todo / In Progress / Done columns), drag-and-drop status changes, task cards showing progress bar, assignees, priority, due date |
| **Task Detail (panel/modal)** | Type toggle (simple/checklist), weight, subtasks list, assignees, priority, due date, comments, attachments, activity log, time tracking |
| **My Tasks** | Cross-project task list, filterable by project/status/priority/due date |
| **Trash** | Soft-deleted projects/tasks — restore or permanently delete |
| **Search** | Global search results across projects/tasks/comments |
| **Settings** | Role & permission management, project member management |

---

## 6. Build Plan (Phased)

### Phase 0 — Schema Completion
Add all missing models (`Project`, `ProjectMember`, `Task`, `TaskAssignee`, `Subtask`, `Comment`, `Attachment`, `TaskDependency`, `TimeLog`, `Notification`). Run migrations. Seed with test users/roles/projects/tasks.

**Deliverable:** Migrated database + seed data ready for development.

---

### Phase 1 — Auth + Base CRUD
Confirm/extend existing auth (login, refresh token rotation, session management). Build Project CRUD, project membership management, Task CRUD (simple/checklist), Subtask CRUD with weight validation (block save until sums to 100), assignee management, and status auto-derivation from progress %.

**Deliverable:** Fully working project/task/subtask system via API, testable independent of UI.

---

### Phase 2 — Core UI
Build My Dashboard, Projects list, Project Detail board view (drag-and-drop), Task Detail panel (including subtask checklist with weight inputs and assignee picker), and My Tasks page.

**Deliverable:** Usable end-to-end app — create projects, add tasks, assign people, track progress visually.

---

### Phase 3 — Comments + Activity Log + Attachments
Comment threads on tasks. Activity log auto-populated via existing `AuditLog` model (task creation, status changes, assignment changes, comments). File attachment upload/download/delete on tasks and comments.

**Deliverable:** Task detail page feels complete — full context, history, and files in one place.

---

### Phase 4 — Task Dependencies
Add "depends on" / "blocks" relationships. UI indicator for blocked tasks. Decide hard-block vs warning when a dependency isn't complete. Circular dependency detection (graph cycle check) before saving a new relationship.

**Deliverable:** Realistic task graph plus a genuine algorithmic component (cycle detection) worth discussing in interviews.

---

### Phase 5 — Time Tracking
Start/stop timer on task detail, manual time entry, total time spent per task and per project, optional estimated-time field with spent-vs-estimated comparison.

**Deliverable:** Time data captured and ready to feed the (deferred) analytics phase later.

---

### Phase 6 — Notifications
Define trigger points (assignment, overdue, comment, mention, status change on watched task). Create `Notification` records server-side. Build in-app bell/dropdown UI with mark-as-read. Deliver via polling initially.

**Deliverable:** Notifications generated and viewable, functional even before real-time push exists.

---

### Phase 7 — Real-time Layer
Set up WebSocket (Socket.io) or SSE. Push live events: task moved on board, new comment, new notification, assignee added. Client subscribes per-project; UI updates without refetch; toast for new notifications.

**Deliverable:** Live, collaborative feel — changes reflected instantly across sessions/tabs.

---

### Phase 8 — Global Search
Postgres search (start with `ILIKE`, optionally upgrade to `tsvector` full-text search) across task titles/descriptions, project names, comments. Search bar with grouped results.

**Deliverable:** Working global search with grouped, reasonably relevant results.

---

### Phase 9 — Trash / Soft-delete UI
Trash page listing soft-deleted projects/tasks using existing `deletedAt` fields. Restore action. Permanent delete action with confirmation. Optional auto-purge after N days (cron).

**Deliverable:** Existing soft-delete architecture exposed as an actual usable feature.

---

### Phase 10 — Command Palette (Cmd+K)
Quick actions: jump to project/task, create task, go to Dashboard/My Tasks. Fuzzy search across recent items.

**Deliverable:** Polished, "feels like a real product" navigation experience — good for demos.

---

## 7. Phase Ordering Notes

- **Phases 0–3 are strictly sequential** (schema → API → UI → detail features); each depends on the last.
- **Phases 4–10 are largely independent** of each other and can be reordered based on priority, with two exceptions:
  - Notifications (6) should precede Real-time (7), since real-time delivery builds directly on the notification system.
  - Search (8) and Trash (9) are lower-risk and make good filler tasks if progress stalls elsewhere.
- Time Tracking (5) has no dependencies and can be built any time after Phase 2.

---

## 8. Summary of Known Gaps

| Gap | Impact | Status |
|---|---|---|
| `Role` is global-only on `User`, no per-project role override | Cannot assign different roles to the same user across different projects (e.g. Manager on Project A, Dev on Project B) as originally intended | **Flagged, not fixed in this plan** — requires a `ProjectMember` join table with its own role reference; to be handled separately |

---

## 9. Deferred Feature Backlog (Future Work)

- Analytics/Reporting view (burndown charts, workload distribution, velocity, overdue trends)
- Invite flow + email verification (invite link → set password → join project)
- Notion-style personal Notes (separate feature track)