import { getPrismaInstance } from "datasources/prisma";
import type { Permission } from "prisma-client/client";

import { ForbiddenException, NotFoundException } from "utils/errors";

const prisma = getPrismaInstance();

function dedupePermissions(permissions: Permission[]): Permission[] {
  return [...new Set(permissions)];
}

/**
 * Platform permissions when no projectId; merged platform + project role when projectId is set.
 */
export async function getEffectivePermissions(
  userId: string,
  projectId?: string,
): Promise<Permission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { permissions: true } } },
  });
  if (!user) {
    throw new NotFoundException("User", userId);
  }

  const platformPermissions = user.role.permissions;
  if (!projectId) {
    return platformPermissions;
  }

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: { select: { permissions: true } } },
  });
  if (!membership) {
    throw new ForbiddenException("Not a project member");
  }

  return dedupePermissions([...platformPermissions, ...membership.role.permissions]);
}

export async function requirePermission(
  userId: string,
  permission: Permission,
  projectId?: string,
): Promise<Permission[]> {
  const permissions = await getEffectivePermissions(userId, projectId);
  if (!permissions.includes(permission)) {
    throw new ForbiddenException("Forbidden");
  }
  return permissions;
}
