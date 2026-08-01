import { getPrismaInstance } from "datasources/prisma";
import type { GetDashboardInputType } from "interfaces/dashboard";

const prisma = getPrismaInstance();

type KpiTone = "blue" | "emerald" | "amber" | "violet" | "orange" | "indigo" | "rose";

export async function getDashboard(_input: GetDashboardInputType) {
  const [totalUsers, activeUsers, totalRoles, recentUsersResult] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    prisma.role.count({ where: { deletedAt: null } }),
    prisma.user.paginate({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: "desc" },
    }).withPages({ page: 1, limit: 5 }),
  ]);

  const kpis: Array<{
    key: string;
    title: string;
    subtitle?: string;
    value: string;
    tone: KpiTone;
  }> = [
    {
      key: "users-total",
      title: "Total users",
      subtitle: "Registered accounts",
      value: String(totalUsers),
      tone: "blue",
    },
    {
      key: "users-active",
      title: "Active users",
      subtitle: "Currently enabled",
      value: String(activeUsers),
      tone: "emerald",
    },
    {
      key: "roles-total",
      title: "Roles",
      subtitle: "Configured roles",
      value: String(totalRoles),
      tone: "violet",
    },
    {
      key: "users-inactive",
      title: "Inactive users",
      subtitle: "Disabled accounts",
      value: String(totalUsers - activeUsers),
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
  };
}
