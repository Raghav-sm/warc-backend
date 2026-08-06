import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Permission, TaskPriority, TaskStatus } from "./generated/client";
import { hashPassword } from "../src/utils/misc";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "password";

/** Platform-only: assigned on User.roleId */
const PLATFORM_SUPER_ADMIN = Object.values(Permission);

const PLATFORM_ADMIN = [
  Permission.USER_VIEW,
  Permission.USER_CREATE,
  Permission.USER_UPDATE,
  Permission.ROLE_VIEW,
  Permission.ROLE_MANAGE,
  Permission.PROJECT_CREATE,
] as const;

const PLATFORM_VIEWER = [Permission.USER_VIEW, Permission.ROLE_VIEW] as const;

/**
 * In-project management (ProjectMember.roleId).
 * PROJECT_CREATE is also granted so MANAGER can be used as a platform role for team leads.
 */
const PROJECT_MANAGER = [
  Permission.PROJECT_CREATE,
  Permission.PROJECT_EDIT,
  Permission.PROJECT_DELETE,
  Permission.TASK_CREATE,
  Permission.TASK_EDIT_OWN,
  Permission.TASK_EDIT_ANY,
  Permission.TASK_DELETE,
  Permission.TASK_ASSIGN,
  Permission.TASK_CHANGE_STATUS,
  Permission.MEMBER_INVITE,
  Permission.MEMBER_REMOVE,
  Permission.MEMBER_MANAGE_ROLES,
] as const;

/** Contributor: tasks only, no project/member admin */
const PROJECT_DEV = [
  Permission.TASK_CREATE,
  Permission.TASK_EDIT_OWN,
  Permission.TASK_CHANGE_STATUS,
  Permission.TASK_ASSIGN,
] as const;

/** Read-only project member */
const PROJECT_VIEWER = [] as const;

const ROLES = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Full system access",
    permissions: [...PLATFORM_SUPER_ADMIN],
  },
  {
    code: "ADMIN",
    name: "Admin",
    description: "Manage users, roles, and projects",
    permissions: [...PLATFORM_ADMIN],
  },
  {
    code: "VIEWER",
    name: "Viewer",
    description: "Read-only platform access; use as project member for read-only project access",
    permissions: [...PLATFORM_VIEWER, ...PROJECT_VIEWER],
  },
  {
    code: "MANAGER",
    name: "Manager",
    description: "Platform or project lead — can create projects and manage in-project work",
    permissions: [...PROJECT_MANAGER],
  },
  {
    code: "DEV",
    name: "Dev",
    description: "Create and edit own tasks within a project",
    permissions: [...PROJECT_DEV],
  },
] as const;

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  roleCode: "SUPER_ADMIN" | "ADMIN" | "VIEWER" | "MANAGER";
};

const USERS: SeedUser[] = [
  { email: "superadmin@example.com", firstName: "Super", lastName: "Admin", roleCode: "SUPER_ADMIN" },
  { email: "admin@example.com", firstName: "Admin", lastName: "", roleCode: "ADMIN" },
  { email: "viewer@example.com", firstName: "Viewer", lastName: "", roleCode: "VIEWER" },
  { email: "nimisha@example.com", firstName: "Nimisha", lastName: "", roleCode: "MANAGER" },
  { email: "sai@example.com", firstName: "Sai", lastName: "", roleCode: "MANAGER" },
  { email: "shiva@example.com", firstName: "Shiva", lastName: "", roleCode: "MANAGER" },
  { email: "chithra@example.com", firstName: "Chithra", lastName: "", roleCode: "MANAGER" },
  { email: "raghav@example.com", firstName: "Raghav", lastName: "", roleCode: "VIEWER" },
  { email: "shankar@example.com", firstName: "Shankar", lastName: "", roleCode: "VIEWER" },
  { email: "tejas@example.com", firstName: "Tejas", lastName: "", roleCode: "VIEWER" },
  { email: "hussain@example.com", firstName: "Hussain", lastName: "", roleCode: "VIEWER" },
  { email: "pavan@example.com", firstName: "Pavan", lastName: "", roleCode: "VIEWER" },
  { email: "kannan@example.com", firstName: "Kannan", lastName: "", roleCode: "VIEWER" },
  { email: "abhilasha@example.com", firstName: "Abhilasha", lastName: "", roleCode: "VIEWER" },
  { email: "rakesh@example.com", firstName: "Rakesh", lastName: "", roleCode: "VIEWER" },
  { email: "bhoomika@example.com", firstName: "Bhoomika", lastName: "", roleCode: "VIEWER" },
];

type ProjectMemberSeed = { email: string; roleCode: "MANAGER" | "DEV" | "VIEWER" };

type TaskSeed = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight: number;
  progress: number;
  assigneeEmails: string[];
  softDeleted?: boolean;
  /** Days from seed run date; negative = overdue */
  dueDateDaysFromNow?: number;
};

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

type ProjectSeed = {
  name: string;
  description: string;
  members: ProjectMemberSeed[];
  tasks: TaskSeed[];
};

const PROJECTS: ProjectSeed[] = [
  {
    name: "Inventure",
    description:
      "Inventure is Warc Analytics' flagship client engagement for inventory and venture operations. This workspace tracks discovery through delivery: stakeholder workshops, API integrations with legacy ERP systems, executive dashboards, and UAT. Nimisha leads delivery with Raghav and Shankar on implementation.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "nimisha@example.com", roleCode: "MANAGER" },
      { email: "raghav@example.com", roleCode: "DEV" },
      { email: "shankar@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Discovery workshop",
        description:
          "Facilitate a two-day discovery session with Inventure stakeholders. Capture pain points, success metrics, and integration constraints. Output: signed discovery summary and prioritized backlog.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        weight: 20,
        progress: 100,
        assigneeEmails: ["nimisha@example.com", "raghav@example.com"],
      },
      {
        title: "API integration",
        description:
          "Build and test REST connectors for Inventure's inventory API. Include retry logic, error mapping, and sandbox credentials. Target: sync SKU catalog and stock levels every 15 minutes.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 30,
        progress: 45,
        assigneeEmails: ["shankar@example.com", "raghav@example.com"],
        dueDateDaysFromNow: 1,
      },
      {
        title: "Dashboard wireframes",
        description:
          "Produce high-fidelity wireframes for the executive dashboard: KPI tiles, trend charts, and drill-down to SKU detail. Review with client PM before development sprint.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 15,
        progress: 0,
        assigneeEmails: ["raghav@example.com"],
      },
      {
        title: "UAT sign-off",
        description:
          "Coordinate user acceptance testing with Inventure ops team. Document defects, obtain written sign-off, and schedule production cutover window.",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        weight: 25,
        progress: 0,
        assigneeEmails: ["nimisha@example.com"],
        dueDateDaysFromNow: -2,
      },
      {
        title: "Auth middleware hardening",
        description:
          "Review session refresh, CORS, and GraphQL auth guards before UAT. Add regression tests for expired and revoked tokens.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 18,
        progress: 30,
        assigneeEmails: ["shankar@example.com"],
        dueDateDaysFromNow: -1,
      },
      {
        title: "Staging deployment checklist",
        description:
          "Prepare release checklist for Inventure staging: env vars, migrations, smoke tests, and rollback steps.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 12,
        progress: 0,
        assigneeEmails: ["shankar@example.com"],
        dueDateDaysFromNow: 3,
      },
      {
        title: "Discovery summary export",
        description:
          "Export signed discovery workshop notes to PDF for the client archive.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 8,
        progress: 100,
        assigneeEmails: ["shankar@example.com"],
        dueDateDaysFromNow: -4,
      },
      {
        title: "Legacy export script (deprecated)",
        description:
          "One-off CSV export for the old reporting tool. Replaced by the API integration — kept for audit trail only.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 100,
        assigneeEmails: ["shankar@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "CKD",
    description:
      "CKD analytics and reporting program consolidates clinical kidney-disease metrics from multiple source systems. Sai manages the engagement; Tejas and Hussain own data pipeline and automated report generation for monthly compliance submissions.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "sai@example.com", roleCode: "MANAGER" },
      { email: "tejas@example.com", roleCode: "DEV" },
      { email: "hussain@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Data model review",
        description:
          "Review CKD source schemas (HL7 feeds, flat files) and propose normalized star schema. Document PHI handling and retention policies for legal review.",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        weight: 25,
        progress: 100,
        assigneeEmails: ["tejas@example.com", "sai@example.com"],
      },
      {
        title: "Report automation",
        description:
          "Automate monthly CKD compliance PDFs from warehouse tables. Schedule jobs, add email delivery to compliance officers, and log run history for audits.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 35,
        progress: 60,
        assigneeEmails: ["hussain@example.com"],
      },
      {
        title: "Stakeholder demo",
        description:
          "Prepare live demo of dashboards and sample reports for CKD leadership. Include Q&A deck and recording for async reviewers.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 0,
        assigneeEmails: ["tejas@example.com", "sai@example.com"],
      },
      {
        title: "Pilot CSV import (removed)",
        description:
          "Manual CSV upload path superseded by HL7 ingestion. Task archived after migration completed.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 100,
        assigneeEmails: ["hussain@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "UHG",
    description:
      "UHG platform enhancements cover member-permission hardening, performance tuning, and release communications for the unified health gateway. Shiva leads the squad; Pavan and Kannan implement backend changes and benchmark critical paths.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "shiva@example.com", roleCode: "MANAGER" },
      { email: "pavan@example.com", roleCode: "DEV" },
      { email: "kannan@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Sprint planning",
        description:
          "Plan sprint goals, capacity, and dependencies with UHG product owner. Publish sprint board and definition of done for the permission audit epic.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 100,
        assigneeEmails: ["shiva@example.com"],
      },
      {
        title: "Member permissions audit",
        description:
          "Audit effective permissions across sample projects. Fix gaps in GraphQL shield rules and document platform vs project role behavior for support.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 30,
        progress: 30,
        assigneeEmails: ["pavan@example.com", "kannan@example.com"],
      },
      {
        title: "Performance benchmarks",
        description:
          "Run load tests on project list, task board, and global search. Capture p95 latency baselines and file tickets for regressions above threshold.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 25,
        progress: 0,
        assigneeEmails: ["kannan@example.com"],
      },
      {
        title: "Release notes",
        description:
          "Draft customer-facing release notes for the next UHG deploy: permission fixes, search improvements, and known limitations.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 0,
        assigneeEmails: ["shiva@example.com", "pavan@example.com"],
      },
      {
        title: "Old auth middleware spike",
        description:
          "Spike on deprecated middleware — abandoned in favor of current RBAC model.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        weight: 5,
        progress: 0,
        assigneeEmails: ["pavan@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "EY Lilly",
    description:
      "EY Lilly engagement tracker supports pharmaceutical program delivery: requirements traceability, Kanban execution, and client onboarding documentation. Chithra manages the account; Abhilasha and Rakesh execute delivery tasks.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "chithra@example.com", roleCode: "MANAGER" },
      { email: "abhilasha@example.com", roleCode: "DEV" },
      { email: "rakesh@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Requirements capture",
        description:
          "Interview EY Lilly SMEs and document functional requirements in the shared wiki. Map each requirement to tasks and acceptance criteria for traceability.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        weight: 20,
        progress: 100,
        assigneeEmails: ["abhilasha@example.com", "chithra@example.com"],
      },
      {
        title: "Kanban board setup",
        description:
          "Configure project board columns, WIP limits, and task templates for EY Lilly squads. Train client leads on drag-and-drop and status rules.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        weight: 15,
        progress: 70,
        assigneeEmails: ["rakesh@example.com"],
      },
      {
        title: "Client onboarding docs",
        description:
          "Write onboarding guide: login, project navigation, commenting, and escalation contacts. Include screenshots and FAQ for new Lilly users.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 0,
        assigneeEmails: ["abhilasha@example.com", "rakesh@example.com"],
      },
      {
        title: "Duplicate requirements doc",
        description:
          "Accidental duplicate of requirements capture — removed from active backlog.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        weight: 5,
        progress: 0,
        assigneeEmails: ["rakesh@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "Png",
    description:
      "Png delivery pipeline coordinates environment provisioning, backlog grooming, and QA for a regional operations client. Chithra shares management with EY Lilly; Bhoomika and Raghav handle implementation and test coverage.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "chithra@example.com", roleCode: "MANAGER" },
      { email: "bhoomika@example.com", roleCode: "DEV" },
      { email: "raghav@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Environment setup",
        description:
          "Provision staging and UAT environments with seeded data, SSL certs, and CI deploy hooks. Validate connectivity to Png VPN endpoints.",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 100,
        assigneeEmails: ["bhoomika@example.com"],
      },
      {
        title: "Feature backlog grooming",
        description:
          "Refine top 20 backlog items with estimates and dependencies. Split epics into weighted tasks suitable for the Kanban board.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 25,
        progress: 40,
        assigneeEmails: ["raghav@example.com", "chithra@example.com"],
      },
      {
        title: "QA test cases",
        description:
          "Author regression test cases for core flows: login, project board, task update, comments, and trash restore. Link cases to tasks in Warc.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 0,
        assigneeEmails: ["bhoomika@example.com"],
      },
      {
        title: "Abandoned VPN POC",
        description:
          "Proof-of-concept VPN tunnel — client chose managed connector instead.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 20,
        assigneeEmails: ["raghav@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "Aikka",
    description:
      "Aikka product roadmap defines MVP scope, design tokens, and quarterly milestones for a greenfield analytics product. Nimisha leads; Shankar and Tejas split frontend and backend MVP workstreams.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "nimisha@example.com", roleCode: "MANAGER" },
      { email: "shankar@example.com", roleCode: "DEV" },
      { email: "tejas@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Roadmap workshop",
        description:
          "Facilitate roadmap workshop with Aikka founders. Output: themed quarters, MVP cut line, and risk register shared with stakeholders.",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        weight: 15,
        progress: 100,
        assigneeEmails: ["nimisha@example.com"],
      },
      {
        title: "MVP scope definition",
        description:
          "Document MVP feature set: auth, one project template, board, comments, and export. Exclude search and real-time from v1 unless schedule allows.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        weight: 30,
        progress: 55,
        assigneeEmails: ["shankar@example.com", "tejas@example.com"],
        dueDateDaysFromNow: 2,
      },
      {
        title: "Design system tokens",
        description:
          "Define color, spacing, and typography tokens aligned with Aikka brand. Publish tokens for frontend and Figma library sync.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 0,
        assigneeEmails: ["tejas@example.com", "shankar@example.com"],
        dueDateDaysFromNow: 5,
      },
      {
        title: "Onboarding flow prototype",
        description:
          "Wireframe and implement first-run onboarding for Aikka MVP: empty project state, invite CTA, and sample data toggle.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        weight: 16,
        progress: 0,
        assigneeEmails: ["shankar@example.com"],
        dueDateDaysFromNow: 0,
      },
      {
        title: "Analytics event map",
        description:
          "Document core product analytics events for MVP dashboards and funnel reporting.",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        weight: 10,
        progress: 100,
        assigneeEmails: ["shankar@example.com"],
        dueDateDaysFromNow: -2,
      },
      {
        title: "Competitor analysis deck",
        description:
          "Early competitive scan — merged into roadmap workshop outcomes.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 100,
        assigneeEmails: ["nimisha@example.com"],
        softDeleted: true,
      },
    ],
  },
  {
    name: "Slags",
    description:
      "Slags operations dashboard visualizes plant throughput, downtime events, and alerting for manufacturing ops. Sai manages delivery; Hussain and Pavan build widgets, metrics inventory, and on-call alerting rules.",
    members: [
      { email: "admin@example.com", roleCode: "MANAGER" },
      { email: "sai@example.com", roleCode: "MANAGER" },
      { email: "hussain@example.com", roleCode: "DEV" },
      { email: "pavan@example.com", roleCode: "DEV" },
    ],
    tasks: [
      {
        title: "Ops metrics inventory",
        description:
          "Catalog all KPIs Slags ops team needs: OEE, downtime minutes, shift output, scrap rate. Map each metric to source tables and refresh cadence.",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        weight: 20,
        progress: 100,
        assigneeEmails: ["hussain@example.com", "sai@example.com"],
      },
      {
        title: "Dashboard widgets",
        description:
          "Implement dashboard widgets for top six KPIs with drill-down to shift detail. Match Slags color palette and export-to-PDF requirement.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        weight: 35,
        progress: 25,
        assigneeEmails: ["pavan@example.com"],
      },
      {
        title: "Alerting rules",
        description:
          "Configure threshold alerts for downtime spikes and missed production targets. Route notifications to on-call rotation via email.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        weight: 25,
        progress: 0,
        assigneeEmails: ["hussain@example.com", "pavan@example.com"],
      },
      {
        title: "Handover checklist",
        description:
          "Prepare runbook and handover checklist for Slags IT: credentials, deploy steps, backup schedule, and support escalation path.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        weight: 10,
        progress: 0,
        assigneeEmails: ["sai@example.com"],
      },
      {
        title: "Prototype Excel export",
        description:
          "Manual Excel export prototype — replaced by in-app PDF export.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        weight: 5,
        progress: 100,
        assigneeEmails: ["pavan@example.com"],
        softDeleted: true,
      },
    ],
  },
];

async function upsertProject(ownerId: string, seed: ProjectSeed) {
  let project = await prisma.project.findFirst({
    where: { name: seed.name, deletedAt: null },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: seed.name,
        description: seed.description,
        ownerId,
      },
    });
  } else {
    project = await prisma.project.update({
      where: { id: project.id },
      data: { description: seed.description },
    });
  }

  return project;
}

async function upsertMember(
  projectId: string,
  userId: string,
  roleId: string,
) {
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: { roleId },
    create: { userId, projectId, roleId },
  });
}

async function upsertTask(
  projectId: string,
  creatorId: string,
  seed: TaskSeed,
  usersByEmail: Map<string, { id: string }>,
) {
  const deletedAt = seed.softDeleted ? new Date("2026-01-15T10:00:00.000Z") : null;
  const dueDate = seed.dueDateDaysFromNow != null ? daysFromNow(seed.dueDateDaysFromNow) : null;

  const existing = await prisma.task.findFirst({
    where: { projectId, title: seed.title },
  });

  const task = existing
    ? await prisma.task.update({
        where: { id: existing.id },
        data: {
          description: seed.description,
          status: seed.status,
          priority: seed.priority,
          weight: seed.weight,
          progress: seed.progress,
          dueDate,
          deletedAt,
        },
      })
    : await prisma.task.create({
        data: {
          projectId,
          createdById: creatorId,
          title: seed.title,
          description: seed.description,
          status: seed.status,
          priority: seed.priority,
          weight: seed.weight,
          progress: seed.progress,
          dueDate,
          deletedAt,
        },
      });

  const assigneeIds = seed.assigneeEmails
    .map((email) => usersByEmail.get(email)?.id)
    .filter((id): id is string => Boolean(id));

  await prisma.taskAssignee.deleteMany({
    where: {
      taskId: task.id,
      userId: { notIn: assigneeIds.length > 0 ? assigneeIds : ["__none__"] },
    },
  });

  for (const userId of assigneeIds) {
    await prisma.taskAssignee.upsert({
      where: { taskId_userId: { taskId: task.id, userId } },
      update: {},
      create: { taskId: task.id, userId },
    });
  }

  return task;
}

type TaskDependencySeed = {
  projectName: string;
  taskTitle: string;
  dependsOnTitle: string;
};

const TASK_DEPENDENCIES: TaskDependencySeed[] = [
  { projectName: "Inventure", taskTitle: "UAT sign-off", dependsOnTitle: "API integration" },
  { projectName: "Aikka", taskTitle: "Design system tokens", dependsOnTitle: "MVP scope definition" },
  { projectName: "Inventure", taskTitle: "Staging deployment checklist", dependsOnTitle: "Auth middleware hardening" },
];

async function upsertTaskDependency(seed: TaskDependencySeed) {
  const project = await prisma.project.findFirst({
    where: { name: seed.projectName, deletedAt: null },
  });
  if (!project) return;

  const [task, dependsOnTask] = await Promise.all([
    prisma.task.findFirst({
      where: { projectId: project.id, title: seed.taskTitle, deletedAt: null },
    }),
    prisma.task.findFirst({
      where: { projectId: project.id, title: seed.dependsOnTitle, deletedAt: null },
    }),
  ]);

  if (!task || !dependsOnTask) return;

  await prisma.taskDependency.upsert({
    where: {
      taskId_dependsOnTaskId: { taskId: task.id, dependsOnTaskId: dependsOnTask.id },
    },
    update: {},
    create: {
      taskId: task.id,
      dependsOnTaskId: dependsOnTask.id,
    },
  });
}

async function seedDashboardNotifications(usersByEmail: Map<string, { id: string; email: string }>) {
  const shankar = usersByEmail.get("shankar@example.com");
  if (!shankar) return;

  const [mvpTask, apiTask, designTask] = await Promise.all([
    prisma.task.findFirst({ where: { title: "MVP scope definition", deletedAt: null } }),
    prisma.task.findFirst({ where: { title: "API integration", deletedAt: null } }),
    prisma.task.findFirst({ where: { title: "Design system tokens", deletedAt: null } }),
  ]);

  await prisma.notification.deleteMany({ where: { userId: shankar.id } });

  const rows: Array<{
    userId: string;
    type: string;
    entityType: string;
    entityId: string;
    message: string;
    isRead: boolean;
  }> = [];

  if (mvpTask) {
    rows.push({
      userId: shankar.id,
      type: "TASK_ASSIGNED",
      entityType: "TASK",
      entityId: mvpTask.id,
      message: "You were assigned to MVP scope definition",
      isRead: false,
    });
  }

  if (apiTask) {
    rows.push({
      userId: shankar.id,
      type: "COMMENT",
      entityType: "TASK",
      entityId: apiTask.id,
      message: "Raghav commented on API integration",
      isRead: false,
    });
  }

  if (designTask) {
    rows.push({
      userId: shankar.id,
      type: "COMMENT",
      entityType: "TASK",
      entityId: designTask.id,
      message: "Tejas commented on Design system tokens",
      isRead: true,
    });
  }

  if (rows.length > 0) {
    await prisma.notification.createMany({ data: rows });
  }
}

async function main() {
  const passwordHash = hashPassword(SEED_PASSWORD);

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        permissions: [...role.permissions],
      },
    });
  }

  const rolesByCode = new Map((await prisma.role.findMany()).map((role) => [role.code, role]));
  const usersByEmail = new Map<string, { id: string; email: string }>();

  for (const user of USERS) {
    const role = rolesByCode.get(user.roleCode);
    if (!role) {
      throw new Error(`Role ${user.roleCode} not found`);
    }

    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        password: passwordHash,
        roleId: role.id,
        isActive: true,
        emailVerified: true,
      },
      create: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: passwordHash,
        roleId: role.id,
        isActive: true,
        emailVerified: true,
      },
      select: { id: true, email: true },
    });

    usersByEmail.set(saved.email, saved);
  }

  const admin = usersByEmail.get("admin@example.com");
  if (!admin) {
    throw new Error("Admin user not found after seed");
  }

  let totalTasks = 0;
  let activeTasks = 0;
  let deletedTasks = 0;

  for (const projectSeed of PROJECTS) {
    const project = await upsertProject(admin.id, projectSeed);

    for (const member of projectSeed.members) {
      const user = usersByEmail.get(member.email);
      const role = rolesByCode.get(member.roleCode);
      if (!user || !role) {
        throw new Error(`Missing user or role for member ${member.email}`);
      }
      await upsertMember(project.id, user.id, role.id);
    }

    for (const taskSeed of projectSeed.tasks) {
      await upsertTask(project.id, admin.id, taskSeed, usersByEmail);
      totalTasks += 1;
      if (taskSeed.softDeleted) {
        deletedTasks += 1;
      } else {
        activeTasks += 1;
      }
    }
  }

  for (const dependency of TASK_DEPENDENCIES) {
    await upsertTaskDependency(dependency);
  }

  await seedDashboardNotifications(usersByEmail);

  console.log("Seed complete:");
  console.log("  Platform roles:");
  console.log("    SUPER_ADMIN — full access");
  console.log("    ADMIN — users, roles (ROLE_MANAGE), projects, permanent delete");
  console.log("    MANAGER — create projects + in-project management (platform role for team leads)");
  console.log("    VIEWER — read-only platform (devs)");
  console.log("  Project roles: MANAGER, DEV, VIEWER (ProjectMember.roleId)");
  console.log(`  Projects seeded: ${PROJECTS.map((p) => p.name).join(", ")}`);
  console.log(`  Tasks: ${totalTasks} total (${activeTasks} active, ${deletedTasks} soft-deleted for Trash)`);
  console.log("  Dashboard demo: task dependencies, Shankar notifications, due dates across projects");
  console.log("  All accounts use password: password");
  console.log("  Managers (platform MANAGER): nimisha@, sai@, shiva@, chithra@");
  console.log("  Devs (platform VIEWER): raghav@, shankar@, tejas@, hussain@, pavan@, kannan@, abhilasha@, rakesh@, bhoomika@");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
