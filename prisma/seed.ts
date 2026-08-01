import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Permission } from "./generated/client";
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
  Permission.PROJECT_CREATE,
] as const;

const PLATFORM_VIEWER = [Permission.USER_VIEW, Permission.ROLE_VIEW] as const;

/**
 * In-project management (ProjectMember.roleId).
 * PROJECT_CREATE is platform-only — not included here.
 */
const PROJECT_MANAGER = [
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

/** Read-only project member (same role record used when assigned as project VIEWER) */
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
    description: "Manage users, create projects, view roles (no role editing)",
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
    description: "Full in-project management (assign via ProjectMember.roleId)",
    permissions: [...PROJECT_MANAGER],
  },
  {
    code: "DEV",
    name: "Dev",
    description: "Create and edit own tasks within a project",
    permissions: [...PROJECT_DEV],
  },
] as const;

const USERS = [
  { email: "superadmin@example.com", firstName: "Super", lastName: "Admin", roleCode: "SUPER_ADMIN" },
  { email: "admin@example.com", firstName: "Admin", lastName: "User", roleCode: "ADMIN" },
  { email: "viewer@example.com", firstName: "Viewer", lastName: "User", roleCode: "VIEWER" },
  { email: "sai@example.com", firstName: "Sai", lastName: "User", roleCode: "VIEWER" },
  { email: "raghav@example.com", firstName: "Raghav", lastName: "User", roleCode: "VIEWER" },
  { email: "abhi@example.com", firstName: "Abhi", lastName: "User", roleCode: "VIEWER" },
] as const;

const DEMO_PROJECT_NAME = "Demo Project";

const DEMO_PROJECT_MEMBERS = [
  { email: "admin@example.com", roleCode: "MANAGER" },
  { email: "sai@example.com", roleCode: "MANAGER" },
  { email: "raghav@example.com", roleCode: "DEV" },
  { email: "abhi@example.com", roleCode: "VIEWER" },
] as const;

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

  let demoProject = await prisma.project.findFirst({
    where: { name: DEMO_PROJECT_NAME, deletedAt: null },
  });

  if (!demoProject) {
    demoProject = await prisma.project.create({
      data: {
        name: DEMO_PROJECT_NAME,
        description: "Seeded project for RBAC testing",
        ownerId: admin.id,
      },
    });
  }

  for (const member of DEMO_PROJECT_MEMBERS) {
    const user = usersByEmail.get(member.email);
    const role = rolesByCode.get(member.roleCode);
    if (!user) {
      throw new Error(`User ${member.email} not found`);
    }
    if (!role) {
      throw new Error(`Role ${member.roleCode} not found`);
    }

    await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: demoProject.id,
        },
      },
      update: { roleId: role.id },
      create: {
        userId: user.id,
        projectId: demoProject.id,
        roleId: role.id,
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Platform roles: SUPER_ADMIN (all), ADMIN (users + projects), VIEWER (read-only)");
  console.log("  Project roles: MANAGER, DEV, VIEWER (empty project perms when used as member)");
  console.log("  superadmin@example.com / password — Super Admin");
  console.log("  admin@example.com / password — Admin (can create projects, not roles)");
  console.log("  viewer@example.com / password — Viewer (read-only everywhere)");
  console.log("  sai@example.com / password — Viewer platform, Manager on Demo Project");
  console.log("  raghav@example.com / password — Viewer platform, Dev on Demo Project");
  console.log("  abhi@example.com / password — Viewer platform, Viewer on Demo Project");
  console.log(`  Demo Project: "${DEMO_PROJECT_NAME}" (admin, sai=Manager, raghav=Dev, abhi=Viewer)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
