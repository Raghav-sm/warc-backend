# Warc Backend

Auth + RBAC GraphQL backend for Warc Analytics, built with Express, Apollo Server, Prisma, and PostgreSQL.

## Setup

1. Copy the environment file and set your database name:

```bash
cp .env.example .env
# Edit DATABASE_URL — change the database name to your project name
```

2. Install dependencies and bootstrap the database:

```bash
yarn install
yarn db:setup
```

3. Start the development server:

```bash
yarn dev
```

- GraphQL HTTP: `http://localhost:8081/graphql`
- GraphQL subscriptions (SSE): `http://localhost:8081/graphql/stream`

## Database commands

| Command | Description |
|---------|-------------|
| `yarn db:create` | Create the PostgreSQL database from `DATABASE_URL` |
| `yarn db:migrate` | Run Prisma migrations |
| `yarn db:seed` | Seed roles, team users, client projects, and sample tasks |
| `yarn db:setup` | Run all three in sequence |

Re-run `yarn db:seed` after pulling RBAC or seed changes, then log out and back in.

## Platform vs project roles

See [Agent_docs/RBAC-and-Roles-Guide.md](Agent_docs/RBAC-and-Roles-Guide.md) for the full matrix.

| Layer | Stored on | Role codes |
|-------|-----------|------------|
| **Platform** | `User.roleId` | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `VIEWER` |
| **Project** | `ProjectMember.roleId` | `MANAGER`, `DEV`, `VIEWER` |

Effective permissions merge platform + project role when acting inside a project (`getEffectivePermissions`).

## Seeded users

All users share the password `password`. Emails follow `firstname@example.com`.

| Email | Platform role | Notes |
|-------|---------------|-------|
| `superadmin@example.com` | Super Admin | Full access |
| `admin@example.com` | Admin | Users, roles, projects, permanent delete |
| `viewer@example.com` | Viewer | Read-only platform demo account |
| `nimisha@`, `sai@`, `shiva@`, `chithra@` | Manager | Can create projects |
| `raghav@`, `shankar@`, `tejas@`, `hussain@`, `pavan@`, `kannan@`, `abhilasha@`, `rakesh@`, `bhoomika@` | Viewer | Devs — no project create |

## Seeded projects

Inventure, CKD, UHG, EY Lilly, Png, Aikka, Slags — each with managers, devs, and sample tasks.

## Permissions

**Platform:** `USER_*`, `ROLE_VIEW`, `ROLE_MANAGE`, `SESSION_MANAGE`, `AUDIT_LOG_VIEW`, `PROJECT_CREATE`

**Project/task:** `PROJECT_EDIT`, `PROJECT_DELETE`, `TASK_*`, `MEMBER_*`

## Delete flow

1. **Soft delete** — `deleteTask` / `deleteProject` sets `deletedAt`; item appears in Trash.
2. **Restore** — Trash mutations; requires project edit permissions.
3. **Hard delete** — `permanentDeleteProject` / `permanentDeleteTask`; **Admin and Super Admin only**.

## Real-time

GraphQL subscriptions over SSE via `graphql-sse` at `/graphql/stream`. Events: `taskUpdated`, `commentAdded`, `notificationCreated`.

## Project structure

```
src/
├── schema/           # GraphQL modules (auth, user, role, project, task, trash, search, …)
├── interfaces/       # Zod schemas per domain
├── datasources/      # Prisma client, session cache
├── utils/            # JWT, effective-permissions, pubsub, validation
├── graphql-rules.ts
└── graphql-field-permissions.ts
prisma/
├── schema.prisma
└── seed.ts
Agent_docs/           # Implementation status and phase plans
```

## Documentation

- [Agent_docs/README.md](Agent_docs/README.md) — doc index
- [Dashboard-Guide.md](Agent_docs/Dashboard-Guide.md) — dashboard layout and API
- [Implementation-Status.md](Agent_docs/Implementation-Status.md) — shipped vs deferred
- [RBAC-and-Roles-Guide.md](Agent_docs/RBAC-and-Roles-Guide.md) — roles and permissions
