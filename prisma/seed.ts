import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Permission } from "./generated/client";
import { hashPassword } from "../src/utils/misc";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "password";

const ROLES = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Full system access",
    permissions: Object.values(Permission),
  },
  {
    code: "ADMIN",
    name: "Admin",
    description: "Manage users and view roles",
    permissions: [Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.ROLE_VIEW],
  },
  {
    code: "VIEWER",
    name: "Viewer",
    description: "Read-only access",
    permissions: [Permission.USER_VIEW, Permission.ROLE_VIEW],
  },
] as const;

const USERS = [
  { email: "superadmin@example.com", firstName: "Super", lastName: "Admin", roleCode: "SUPER_ADMIN" },
  { email: "admin@example.com", firstName: "Admin", lastName: "User", roleCode: "ADMIN" },
  { email: "viewer@example.com", firstName: "Viewer", lastName: "User", roleCode: "VIEWER" },
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

  const rolesByCode = new Map(
    (await prisma.role.findMany()).map((role) => [role.code, role]),
  );

  for (const user of USERS) {
    const role = rolesByCode.get(user.roleCode);
    if (!role) {
      throw new Error(`Role ${user.roleCode} not found`);
    }

    await prisma.user.upsert({
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
    });
  }

  console.log("Seed complete:");
  console.log("  superadmin@example.com / password (Super Admin)");
  console.log("  admin@example.com / password (Admin)");
  console.log("  viewer@example.com / password (Viewer)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
