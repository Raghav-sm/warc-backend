import { getPrismaInstance } from "datasources/prisma";
import type { GetDashboardInputType } from "interfaces/dashboard";

import { calcProjectProgress } from "utils/progress";

const prisma = getPrismaInstance();

type KpiTone = "blue" | "emerald" | "amber" | "violet" | "orange" | "indigo" | "rose";

export async function getDashboard(input: GetDashboardInputType) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: input.userId, project: { deletedAt: null } },
    select: { projectId: true },
  });
  const projectIds = memberships.map((m) => m.projectId);

  const [totalUsers, activeUsers, totalRoles, recentUsersResult, projects, myTasks] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.role.count({ where: { deletedAt: null } }),
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
      orderBy: { assignedAt: "desc" },
      take: 10,
    }),
  ]);

  const userProjectCount = projectIds.length;
  const userTaskCount = myTasks.length;

  const kpis: Array<{
    key: string;
    title: string;
    subtitle?: string;
    value: string;
    tone: KpiTone;
  }> = [
    {
      key: "projects-total",
      title: "My projects",
      subtitle: "Projects you belong to",
      value: String(userProjectCount),
      tone: "blue",
    },
    {
      key: "tasks-total",
      title: "My tasks",
      subtitle: "Assigned to you",
      value: String(userTaskCount),
      tone: "emerald",
    },
    {
      key: "users-total",
      title: "Total users",
      subtitle: "Registered accounts",
      value: String(totalUsers),
      tone: "violet",
    },
    {
      key: "users-active",
      title: "Active users",
      subtitle: "Currently enabled",
      value: String(activeUsers),
      tone: "amber",
    },
  ];

  const [recentUsers] = recentUsersResult;

  return {
    kpis,
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
  };
}
