import { getPrismaInstance } from "datasources/prisma";
import { invalidateUser } from "datasources/session-cache";
import type {
  AssignUserRoleInputType,
  CreateUserInputType,
  DeleteUserInputType,
  GetUserInputType,
  GetUsersInputType,
  UpdateUserInputType,
  UserFilterInputType,
} from "interfaces/user";
import type { Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { ConflictException, NotFoundException, ValidationException } from "utils/errors";
import { hashPassword } from "utils/misc";
import { hasProvided } from "utils/validation";

const prisma = getPrismaInstance();

function buildUserWhere(filters: UserFilterInputType = {}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (hasProvided(filters?.text)) {
    where.OR = [
      { firstName: { contains: filters.text, mode: "insensitive" } },
      { lastName: { contains: filters.text, mode: "insensitive" } },
      { email: { contains: filters.text, mode: "insensitive" } },
    ];
  }

  if (hasProvided(filters?.roleId)) {
    where.roleId = filters.roleId;
  }

  if (hasProvided(filters?.isActive)) {
    where.isActive = filters.isActive;
  }

  return where;
}

function mapUser(user: Prisma.UserGetPayload<{ include: { role: true } }>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleCode: user.role.code,
    roleName: user.role.name,
    isActive: user.isActive,
    permissions: user.role.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUser(input: GetUserInputType) {
  const user = await prisma.user.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { role: true },
  });
  if (!user) {
    throw new NotFoundException("User", input.id);
  }

  return mapUser(user);
}

export async function getUsers(input: GetUsersInputType) {
  const [nodes, pageInfo] = await prisma.user
    .paginate({
      where: buildUserWhere(input.filters),
      include: { role: true },
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapUser),
    pageInfo,
  };
}

export async function createUser(input: CreateUserInputType) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new ConflictException("User already exists", "CONFLICT", { field: "email" });
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) {
    throw new NotFoundException("Role", input.roleId);
  }

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: hashPassword(input.password),
      roleId: input.roleId,
    },
    include: { role: true },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "USER",
    entityId: user.id,
    after: mapUser(user),
  });

  return mapUser(user);
}

export async function updateUser(input: UpdateUserInputType) {
  const before = await prisma.user.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { role: true },
  });
  if (!before) {
    throw new NotFoundException("User", input.id);
  }

  if (hasProvided(input.email) && input.email !== before.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new ConflictException("User already exists", "CONFLICT", { field: "email" });
    }
  }

  if (hasProvided(input.roleId)) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) {
      throw new NotFoundException("Role", input.roleId);
    }
  }

  const user = await prisma.user.update({
    where: { id: input.id },
    data: {
      firstName: input.firstName ?? before.firstName,
      lastName: input.lastName ?? before.lastName,
      email: input.email ?? before.email,
      roleId: input.roleId ?? before.roleId,
      isActive: input.isActive ?? before.isActive,
    },
    include: { role: true },
  });

  if (input.actorId) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "UPDATE",
      entityType: "USER",
      entityId: input.id,
      before: mapUser(before),
      after: mapUser(user),
    });
  }

  invalidateUser(input.id);

  return mapUser(user);
}

export async function deleteUser(input: DeleteUserInputType) {
  if (input.id === input.actorId) {
    throw new ValidationException("You cannot delete your own account", "BAD_USER_INPUT", { field: "id" });
  }

  const before = await prisma.user.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { role: true },
  });
  if (!before) {
    throw new NotFoundException("User", input.id);
  }

  await prisma.user.update({
    where: { id: input.id },
    data: { deletedAt: new Date(), isActive: false },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "USER",
    entityId: input.id,
    before: mapUser(before),
  });

  invalidateUser(input.id);

  return true;
}

export async function assignUserRole(input: AssignUserRoleInputType) {
  const before = await prisma.user.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { role: true },
  });
  if (!before) {
    throw new NotFoundException("User", input.id);
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) {
    throw new NotFoundException("Role", input.roleId);
  }

  const user = await prisma.user.update({
    where: { id: input.id },
    data: { roleId: input.roleId },
    include: { role: true },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "ASSIGN_ROLE",
    entityType: "USER",
    entityId: input.id,
    before: mapUser(before),
    after: mapUser(user),
  });

  invalidateUser(input.id);

  return mapUser(user);
}
