import { getPrismaInstance } from "datasources/prisma";
import type { GetDashboardInputType } from "interfaces/dashboard";
import { TaskPriority, TaskStatus } from "prisma-client/enums";

import { getBlockedTaskIds } from "schema/task-dependency/blocking";

import { calcProjectProgress } from "utils/progress";

const prisma = getPrismaInstance();

type KpiTone = "blue" | "emerald" | "amber" | "violet" | "orange" | "indigo" | "rose";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const STALE_DAYS = 7;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUserName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
}

function isOverdueOpenTask(task: { status: TaskStatus; dueDate: Date | null }, today: Date): boolean {
  return task.status !== TaskStatus.DONE && task.dueDate != null && task.dueDate < today;
}

function buildTasksDueByDay(
  tasks: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    status: TaskStatus;
    project: { id: string; name: string };
  }>,
) {
  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE && task.dueDate);
  const today = startOfLocalDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const day = addLocalDays(today, index);
    const dayTasks = openTasks
      .filter((task) => isSameLocalDay(task.dueDate as Date, day))
      .map((task) => ({
        id: task.id,
        title: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
      }));

    return {
      date: toDateKey(day),
      label: DAY_LABELS[day.getDay()],
      count: dayTasks.length,
      tasks: dayTasks,
    };
  });
}

function buildTaskStatusBreakdown(tasks: Array<{ status: TaskStatus }>) {
  const counts = new Map<TaskStatus, number>([
    [TaskStatus.TODO, 0],
    [TaskStatus.IN_PROGRESS, 0],
    [TaskStatus.DONE, 0],
  ]);

  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
}

type ProjectTaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  updatedAt: Date;
  projectId: string;
  project: { id: string; name: string; updatedAt: Date };
  assignees: Array<{ user: { id: string; firstName: string; lastName: string } }>;
};

function buildAttentionItems(
  userId: string,
  myOpenTasks: ProjectTaskRow[],
  blockedIds: Set<string>,
  notifications: Array<{ id: string; message: string; isRead: boolean; entityType: string; entityId: string }>,
  taskProjectMap: Map<string, { projectId: string; projectName: string; title: string }>,
) {
  const today = startOfLocalDay(new Date());
  const items: Array<{
    id: string;
    kind: string;
    title: string;
    subtitle: string;
    taskId?: string;
    projectId?: string;
    notificationId?: string;
  }> = [];

  for (const task of myOpenTasks) {
    const projectName = task.project.name;
    if (isOverdueOpenTask(task, today)) {
      items.push({
        id: `overdue-${task.id}`,
        kind: "OVERDUE",
        title: task.title,
        subtitle: `Overdue · ${projectName}`,
        taskId: task.id,
        projectId: task.projectId,
      });
    } else if (task.dueDate && isSameLocalDay(task.dueDate, today)) {
      items.push({
        id: `due-today-${task.id}`,
        kind: "DUE_TODAY",
        title: task.title,
        subtitle: `Due today · ${projectName}`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }

    if (blockedIds.has(task.id)) {
      items.push({
        id: `blocked-${task.id}`,
        kind: "BLOCKED",
        title: task.title,
        subtitle: `Blocked · ${projectName}`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }

    if (task.priority === TaskPriority.URGENT || task.priority === TaskPriority.HIGH) {
      items.push({
        id: `priority-${task.id}`,
        kind: "URGENT",
        title: task.title,
        subtitle: `${task.priority === TaskPriority.URGENT ? "Urgent" : "High"} · ${projectName}`,
        taskId: task.id,
        projectId: task.projectId,
      });
    }
  }

  for (const notification of notifications.filter((n) => !n.isRead).slice(0, 5)) {
    const ctx = notification.entityType === "TASK" ? taskProjectMap.get(notification.entityId) : undefined;
    items.push({
      id: `notification-${notification.id}`,
      kind: "NOTIFICATION",
      title: notification.message,
      subtitle: ctx ? ctx.projectName : "Unread notification",
      taskId: notification.entityType === "TASK" ? notification.entityId : undefined,
      projectId: ctx?.projectId,
      notificationId: notification.id,
    });
  }

  const kindOrder: Record<string, number> = {
    OVERDUE: 0,
    DUE_TODAY: 1,
    BLOCKED: 2,
    URGENT: 3,
    NOTIFICATION: 4,
  };

  return items
    .sort((a, b) => (kindOrder[a.kind] ?? 99) - (kindOrder[b.kind] ?? 99))
    .slice(0, 12);
}

function buildProjectHealth(
  projects: Array<{ id: string; name: string; updatedAt: Date }>,
  projectTasks: ProjectTaskRow[],
  blockedIds: Set<string>,
) {
  const today = startOfLocalDay(new Date());
  const staleBefore = addLocalDays(today, -STALE_DAYS);

  return projects.map((project) => {
    const tasks = projectTasks.filter((task) => task.projectId === project.id);
    const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);
    const overdueCount = openTasks.filter((task) => isOverdueOpenTask(task, today)).length;
    const blockedCount = openTasks.filter((task) => blockedIds.has(task.id)).length;
    const latestTaskUpdate = tasks.reduce(
      (max, task) => (task.updatedAt > max ? task.updatedAt : max),
      project.updatedAt,
    );

    let healthStatus = "ON_TRACK";
    if (overdueCount > 0 || blockedCount > 0) {
      healthStatus = "AT_RISK";
    } else if (latestTaskUpdate < staleBefore) {
      healthStatus = "STALE";
    }

    return {
      projectId: project.id,
      projectName: project.name,
      openTaskCount: openTasks.length,
      overdueCount,
      blockedCount,
      healthStatus,
    };
  });
}

function buildTeamWorkload(projectTasks: ProjectTaskRow[]) {
  const counts = new Map<string, { userName: string; openTaskCount: number }>();

  for (const task of projectTasks) {
    if (task.status === TaskStatus.DONE) continue;
    for (const assignee of task.assignees) {
      const user = assignee.user;
      const existing = counts.get(user.id);
      if (existing) {
        existing.openTaskCount += 1;
      } else {
        counts.set(user.id, {
          userName: formatUserName(user.firstName, user.lastName),
          openTaskCount: 1,
        });
      }
    }
  }

  return Array.from(counts.entries())
    .map(([userId, row]) => ({ userId, ...row }))
    .sort((a, b) => b.openTaskCount - a.openTaskCount)
    .slice(0, 8);
}

function buildProjectRiskTasks(projectTasks: ProjectTaskRow[], blockedIds: Set<string>) {
  const today = startOfLocalDay(new Date());

  return projectTasks
    .filter((task) => task.status !== TaskStatus.DONE)
    .map((task) => {
      const overdue = isOverdueOpenTask(task, today);
      const blocked = blockedIds.has(task.id);
      const assigneeNames = task.assignees.map((a) => formatUserName(a.user.firstName, a.user.lastName));

      let reason = "";
      if (overdue && blocked) reason = "Overdue · blocked";
      else if (overdue) reason = "Overdue";
      else if (blocked) reason = "Blocked";

      return {
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        projectName: task.project.name,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        isOverdue: overdue,
        isBlocked: blocked,
        assigneeNames,
        reason,
      };
    })
    .filter((task) => task.isOverdue || task.isBlocked)
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue))
    .slice(0, 10);
}

export async function getDashboard(input: GetDashboardInputType) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: input.userId, project: { deletedAt: null } },
    select: { projectId: true },
  });
  const projectIds = memberships.map((m) => m.projectId);

  const [
    assignedTasks,
    projectTasksRaw,
    recentUsersResult,
    projects,
    myTasks,
    notifications,
    activeTimerLog,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        deletedAt: null,
        project: { deletedAt: null },
        assignees: { some: { userId: input.userId } },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        priority: true,
        project: { select: { id: true, name: true } },
      },
    }),
    projectIds.length
      ? prisma.task.findMany({
          where: {
            deletedAt: null,
            projectId: { in: projectIds },
            project: { deletedAt: null },
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            updatedAt: true,
            projectId: true,
            project: { select: { id: true, name: true, updatedAt: true } },
            assignees: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        })
      : Promise.resolve([]),
    prisma.user.paginate({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: "desc" },
    }).withPages({ page: 1, limit: 5 }),
    projectIds.length
      ? prisma.project.findMany({
          where: { id: { in: projectIds }, deletedAt: null },
          include: {
            members: true,
            tasks: { where: { deletedAt: null }, select: { weight: true, progress: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    prisma.taskAssignee.findMany({
      where: {
        userId: input.userId,
        task: { deletedAt: null, project: { deletedAt: null } },
      },
      include: {
        task: {
          include: { project: { select: { name: true } } },
        },
      },
      orderBy: [{ task: { dueDate: { sort: "asc", nulls: "last" } } }, { assignedAt: "desc" }],
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.timeLog.findFirst({
      where: { userId: input.userId, endedAt: null },
      include: {
        task: { include: { project: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const projectTasks = projectTasksRaw as ProjectTaskRow[];
  const projectTaskIds = projectTasks.map((task) => task.id);
  const blockedIds = await getBlockedTaskIds(projectTaskIds);

  const myAssignedFull = projectTasks.filter((task) =>
    task.assignees.some((a) => a.user.id === input.userId),
  );
  const myOpenTasks = myAssignedFull.filter((task) => task.status !== TaskStatus.DONE);

  const taskProjectMap = new Map(
    projectTasks.map((task) => [
      task.id,
      { projectId: task.projectId, projectName: task.project.name, title: task.title },
    ]),
  );

  const userProjectCount = projectIds.length;
  const today = startOfLocalDay(new Date());
  const weekEnd = addLocalDays(today, 7);
  const weekAgo = addLocalDays(today, -STALE_DAYS);

  const openTasks = assignedTasks.filter((task) => task.status !== TaskStatus.DONE);
  const dueThisWeek = openTasks.filter(
    (task) => task.dueDate && task.dueDate >= today && task.dueDate < weekEnd,
  ).length;
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < today).length;

  const projectOpenTasks = projectTasks.filter((task) => task.status !== TaskStatus.DONE);
  const projectOverdue = projectOpenTasks.filter((task) => isOverdueOpenTask(task, today)).length;
  const projectBlocked = projectOpenTasks.filter((task) => blockedIds.has(task.id)).length;
  const activeProjectsThisWeek = projects.filter((project) => project.updatedAt >= weekAgo).length;

  const kpis = [
    {
      key: "projects-total",
      title: "My projects",
      subtitle: "Projects you belong to",
      value: String(userProjectCount),
      tone: "blue" as KpiTone,
    },
    {
      key: "tasks-open",
      title: "Open tasks",
      subtitle: "Assigned to you",
      value: String(openTasks.length),
      tone: "emerald" as KpiTone,
    },
    {
      key: "tasks-due-week",
      title: "Due this week",
      subtitle: "Your tasks · next 7 days",
      value: String(dueThisWeek),
      tone: "amber" as KpiTone,
    },
    {
      key: "tasks-overdue",
      title: "Overdue",
      subtitle: "Your tasks · past due",
      value: String(overdueTasks),
      tone: overdueTasks > 0 ? ("rose" as KpiTone) : ("violet" as KpiTone),
    },
  ];

  const projectKpis = [
    {
      key: "project-open-tasks",
      title: "Open on projects",
      subtitle: "All assignees on your projects",
      value: String(projectOpenTasks.length),
      tone: "blue" as KpiTone,
    },
    {
      key: "project-overdue",
      title: "Overdue on projects",
      subtitle: "Any team member",
      value: String(projectOverdue),
      tone: projectOverdue > 0 ? ("rose" as KpiTone) : ("emerald" as KpiTone),
    },
    {
      key: "project-blocked",
      title: "Blocked on projects",
      subtitle: "Waiting on dependencies",
      value: String(projectBlocked),
      tone: projectBlocked > 0 ? ("amber" as KpiTone) : ("violet" as KpiTone),
    },
    {
      key: "projects-active-week",
      title: "Active projects",
      subtitle: "Updated in last 7 days",
      value: String(activeProjectsThisWeek),
      tone: "indigo" as KpiTone,
    },
  ];

  const [recentUsers] = recentUsersResult;

  const notificationTaskIds = notifications
    .filter((n) => n.entityType === "TASK")
    .map((n) => n.entityId);

  const activityTasks =
    notificationTaskIds.length > 0
      ? await prisma.task.findMany({
          where: { id: { in: notificationTaskIds } },
          select: { id: true, projectId: true, project: { select: { name: true } } },
        })
      : [];

  const activityTaskMap = new Map(activityTasks.map((task) => [task.id, task]));

  return {
    kpis,
    projectKpis,
    recentUsers: recentUsers.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
    projectCards: projects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      progressPercent: calcProjectProgress(project.tasks),
      memberCount: project.members.length,
    })),
    myTasks: myTasks.map(({ task }) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      status: task.status,
      progress: task.progress,
      priority: task.priority,
      dueDate: task.dueDate,
    })),
    taskStatusBreakdown: buildTaskStatusBreakdown(assignedTasks),
    tasksDueByDay: buildTasksDueByDay(
      assignedTasks.map((task) => ({
        ...task,
        project: { id: task.project.id, name: task.project.name },
      })),
    ),
    activeTimer: activeTimerLog
      ? {
          id: activeTimerLog.id,
          taskId: activeTimerLog.taskId,
          taskTitle: activeTimerLog.task.title,
          projectId: activeTimerLog.task.project.id,
          projectName: activeTimerLog.task.project.name,
          startedAt: activeTimerLog.startedAt,
        }
      : null,
    attentionItems: buildAttentionItems(
      input.userId,
      myOpenTasks,
      blockedIds,
      notifications,
      taskProjectMap,
    ),
    recentActivity: notifications.map((notification) => {
      const taskCtx =
        notification.entityType === "TASK" ? activityTaskMap.get(notification.entityId) : undefined;
      return {
        id: notification.id,
        type: notification.type,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        projectId: taskCtx?.projectId,
        projectName: taskCtx?.project.name,
      };
    }),
    projectHealth: buildProjectHealth(projects, projectTasks, blockedIds),
    teamWorkload: buildTeamWorkload(projectTasks),
    projectRiskTasks: buildProjectRiskTasks(projectTasks, blockedIds),
  };
}
