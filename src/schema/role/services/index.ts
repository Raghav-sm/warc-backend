import { getPrismaInstance } from "datasources/prisma";
import { invalidateRoleSessions } from "datasources/session-cache";
import type {
  CreateRoleInputType,
  DeleteRoleInputType,
  GetRoleInputType,
  GetRolesInputType,
  RoleFilterInputType,
  UpdateRoleInputType,
} from "interfaces/roles";
import type { Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { ConflictException, NotFoundException } from "utils/errors";
import { hasProvided } from "utils/validation";

const prisma = getPrismaInstance();

function buildRoleWhere(filters: RoleFilterInputType = {}): Prisma.RoleWhereInput {
  const where: Prisma.RoleWhereInput = {
    deletedAt: null,
  };

  if (hasProvided(filters?.text)) {
    where.OR = [
      { name: { contains: filters.text, mode: "insensitive" } },
      { code: { contains: filters.text, mode: "insensitive" } },
      { description: { contains: filters.text, mode: "insensitive" } },
    ];
  }

  if (hasProvided(filters?.permissionCodes) && filters.permissionCodes.length > 0) {
    where.permissions = { hasEvery: filters.permissionCodes };
  }

  return where;
}

export async function getRole(input: GetRoleInputType) {
  const role = await prisma.role.findFirst({
    where: { id: input.id, deletedAt: null },
  });

  if (!role) {
    throw new NotFoundException("Role", input.id);
  }

  return role;
}

export async function getRoles(input: GetRolesInputType) {
  const [nodes, pageInfo] = await prisma.role
    .paginate({
      where: buildRoleWhere(input.filters),
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return { nodes, pageInfo };
}

export async function createRole(input: CreateRoleInputType) {
  const existing = await prisma.role.findUnique({
    where: { code: input.code },
  });
  if (existing) {
    throw new ConflictException("Role with this code already exists", "CONFLICT", { field: "code" });
  }

  const role = await prisma.role.create({
    data: {
      name: input.name,
      code: input.code,
      description: input.description,
      permissions: input.permissionCodes,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "ROLE",
    entityId: role.id,
    after: role,
  });

  return role;
}

export async function updateRole(input: UpdateRoleInputType) {
  const existingRole = await getRole(input);
  if (!existingRole) {
    throw new NotFoundException("Role", input.id);
  }

  const role = await prisma.role.update({
    where: { id: input.id },
    data: {
      name: input.name ?? existingRole.name,
      description: input.description ?? existingRole.description,
      permissions: input.permissionCodes ?? existingRole.permissions,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "ROLE",
    entityId: input.id,
    before: existingRole,
    after: role,
  });

  const permissionsChanged =
    input.permissionCodes != null &&
    (input.permissionCodes.length !== existingRole.permissions.length ||
      input.permissionCodes.some((code) => !existingRole.permissions.includes(code)));
  if (permissionsChanged) {
    await invalidateRoleSessions(input.id);
  }

  return role;
}

export async function deleteRole(input: DeleteRoleInputType) {
  const role = await prisma.role.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { users: true },
  });
  if (!role) {
    throw new NotFoundException("Role", input.id);
  }
  if (role.users.length > 0) {
    throw new ConflictException("Cannot delete role assigned to users");
  }

  await prisma.role.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "ROLE",
    entityId: input.id,
    before: role,
  });

  return true;
}
