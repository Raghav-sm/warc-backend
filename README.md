# Warc Backend

Auth + RBAC GraphQL backend for Warc Analytics, built with Express, Apollo Server, Prisma, and PostgreSQL.

## Setup

1. Copy the environment file and set your database name:

```bash
cp .env.example .env
# Edit DATABASE_URL — change the database name to your project name
```

2. Install dependencies and bootstrap the database (creates DB, runs first migration, seeds data):

```bash
yarn install
yarn db:setup
```

3. Start the development server:

```bash
yarn dev
```

GraphQL endpoint: `http://localhost:8081/graphql`

## Database commands

| Command | Description |
|---------|-------------|
| `yarn db:create` | Create the PostgreSQL database from `DATABASE_URL` |
| `yarn db:migrate` | Run Prisma migrations (generates initial migration on first run) |
| `yarn db:seed` | Seed roles and demo users |
| `yarn db:setup` | Run all three in sequence |

## Seeded users

All users share the password `password`:

| Email | Role |
|-------|------|
| `superadmin@example.com` | Super Admin (all permissions) |
| `admin@example.com` | Admin (user management + role view) |
| `viewer@example.com` | Viewer (read-only) |

## Permissions

- `USER_VIEW`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`
- `ROLE_VIEW`, `ROLE_MANAGE`
- `SESSION_MANAGE`
- `AUDIT_LOG_VIEW`

## Project structure

```
src/
├── schema/           # GraphQL modules (auth, user, role, session, audit-log, dashboard)
├── interfaces/       # Zod schemas per domain
├── datasources/      # Prisma client, session cache
├── utils/            # JWT, validation, errors, logger
├── graphql-rules.ts          # Reusable shield rule builders
└── graphql-field-permissions.ts  # Field → rule mapping table
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed script
scripts/
└── create-db.ts      # Database creation helper
```
