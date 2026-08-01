import { getPrismaInstance } from "datasources/prisma";
import type {
  AddProjectMemberInputType,
  CreateProjectInputType,
  DeleteProjectInputType,
  GetProjectInputType,
  GetProjectMembersInputType,
  GetProjectsInputType,
  ProjectFilterInputType,
  RemoveProjectMemberInputType,
  UpdateProjectInputType,
  UpdateProjectMemberRoleInputType,
} from "interfaces/project";
import { Permission } from "prisma-client/client";
import type { Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { getEffectivePermissions, requirePermission } from "utils/effective-permissions";
import { ConflictException, ForbiddenException, NotFoundException, ValidationException } from "utils/errors";
import { calcProjectProgress } from "utils/progress";
import { hasProvided } from "utils/validation";

const prisma = getPrismaInstance();

const PROJECT_MEMBER_ROLE_CODES = ["MANAGER", "DEV", "VIEWER"] as const;

type ProjectTaskRow = { weight: number; progress: number };

type MappedProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: Prisma.ProjectGetPayload<object>["status"];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { members: number };
  tasks: ProjectTaskRow[];
  members: Array<{ role: { name: string; code: string } }>;
};

function buildProjectWhere(userId: string, filters: ProjectFilterInputType = {}): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    members: { some: { userId } },
  };

  if (hasProvided(filters?.text)) {
    where.OR = [
      { name: { contains: filters.text, mode: "insensitive" } },
      { description: { contains: filters.text, mode: "insensitive" } },
    ];
  }

  if (hasProvided(filters?.status)) {
    where.status = filters.status;
  }

  return where;
}

function calcProgressFromTasks(tasks: ProjectTaskRow[]): number {
  return calcProjectProgress(tasks);
}

async function mapProjectForUser(project: MappedProjectRow, userId: string) {
  const membership = project.members[0];
  const myPermissions = await getEffectivePermissions(userId, project.id);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
    progressPercent: calcProgressFromTasks(project.tasks),
    memberCount: project._count.members,
    myPermissions,
    myRoleName: membership?.role.name ?? null,
    myRoleCode: membership?.role.code ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function projectIncludeForUser(userId: string): Prisma.ProjectInclude {
  return {
    _count: { select: { members: true } },
    tasks: {
      where: { deletedAt: null },
      select: { weight: true, progress: true },
    },
    members: {
      where: { userId },
      include: { role: true },
    },
  };
}

async function getActiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
  });
  if (!project) {
    throw new NotFoundException("Project", projectId);
  }
  return project;
}

async function assertProjectMember(userId: string, projectId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { role: true },
  });
  if (!membership) {
    throw new ForbiddenException("Not a project member");
  }
  return membership;
}

async function getProjectRoleById(roleId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null },
  });
  if (!role) {
    throw new NotFoundException("Role", roleId);
  }
  return role;
}

function assertProjectMemberRoleCode(roleCode: string) {
  if (!PROJECT_MEMBER_ROLE_CODES.includes(roleCode as (typeof PROJECT_MEMBER_ROLE_CODES)[number])) {
    throw new ValidationException("Role must be MANAGER, DEV, or VIEWER", "BAD_USER_INPUT", { field: "roleId" });
  }
}

function mapProjectMember(
  member: Prisma.ProjectMemberGetPayload<{
    include: { user: true; role: true };
  }>,
) {
  return {
    id: member.id,
    userId: member.userId,
    firstName: member.user.firstName,
    lastName: member.user.lastName,
    email: member.user.email,
    roleId: member.roleId,
    roleCode: member.role.code,
    roleName: member.role.name,
    joinedAt: member.joinedAt,
  };
}

function projectAuditSnapshot(project: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  ownerId: string;
}) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    ownerId: project.ownerId,
  };
}

export async function getProjects(input: GetProjectsInputType) {
  const [nodes, pageInfo] = await prisma.project
    .paginate({
      where: buildProjectWhere(input.userId, input.filters),
      include: projectIncludeForUser(input.userId),
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: await Promise.all(nodes.map((project) => mapProjectForUser(project as unknown as MappedProjectRow, input.userId))),
    pageInfo,
  };
}

export async function getProject(input: GetProjectInputType) {
  const project = await prisma.project.findFirst({
    where: {
      id: input.id,
      deletedAt: null,
      members: { some: { userId: input.userId } },
    },
    include: projectIncludeForUser(input.userId),
  });
  if (!project) {
    throw new NotFoundException("Project", input.id);
  }

  return mapProjectForUser(project as unknown as MappedProjectRow, input.userId);
}

export async function getProjectMembers(input: GetProjectMembersInputType) {
  await assertProjectMember(input.userId, input.projectId);

  const members = await prisma.projectMember.findMany({
    where: { projectId: input.projectId },
    include: { user: true, role: true },
    orderBy: { joinedAt: "asc" },
  });

  return {
    nodes: members.map(mapProjectMember),
  };
}

export async function createProject(input: CreateProjectInputType) {
  await requirePermission(input.userId, Permission.PROJECT_CREATE);

  const managerRole = await prisma.role.findFirst({
    where: { code: "MANAGER", deletedAt: null },
  });
  if (!managerRole) {
    throw new NotFoundException("Role", "MANAGER");
  }

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        ownerId: input.userId,
        members: {
          create: {
            userId: input.userId,
            roleId: managerRole.id,
          },
        },
      },
    });

    await writeAuditLog(
      {
        actorId: input.actorId,
        action: "CREATE",
        entityType: "PROJECT",
        entityId: created.id,
        after: projectAuditSnapshot(created),
      },
      tx,
    );

    return created;
  });

  return getProject({ id: project.id, userId: input.userId });
}

export async function updateProject(input: UpdateProjectInputType) {
  await requirePermission(input.userId, Permission.PROJECT_EDIT, input.id);

  const before = await prisma.project.findFirst({
    where: { id: input.id, deletedAt: null },
  });
  if (!before) {
    throw new NotFoundException("Project", input.id);
  }

  const project = await prisma.project.update({
    where: { id: input.id },
    data: {
      name: input.name ?? before.name,
      description: input.description !== undefined ? input.description : before.description,
      status: input.status ?? before.status,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "PROJECT",
    entityId: input.id,
    before: projectAuditSnapshot(before),
    after: projectAuditSnapshot(project),
  });

  return getProject({ id: project.id, userId: input.userId });
}

export async function deleteProject(input: DeleteProjectInputType) {
  await requirePermission(input.userId, Permission.PROJECT_DELETE, input.id);

  const before = await prisma.project.findFirst({
    where: { id: input.id, deletedAt: null },
  });
  if (!before) {
    throw new NotFoundException("Project", input.id);
  }

  await prisma.project.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "PROJECT",
    entityId: input.id,
    before: projectAuditSnapshot(before),
  });

  return true;
}

export async function addProjectMember(input: AddProjectMemberInputType) {
  await requirePermission(input.userId, Permission.MEMBER_INVITE, input.projectId);
  await getActiveProject(input.projectId);

  const role = await getProjectRoleById(input.roleId);
  assertProjectMemberRoleCode(role.code);

  const memberUser = await prisma.user.findFirst({
    where: { id: input.memberUserId, deletedAt: null },
  });
  if (!memberUser) {
    throw new NotFoundException("User", input.memberUserId);
  }

  const existing = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: input.memberUserId, projectId: input.projectId },
    },
  });
  if (existing) {
    throw new ConflictException("User is already a project member", "CONFLICT", { field: "memberUserId" });
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: input.projectId,
      userId: input.memberUserId,
      roleId: input.roleId,
    },
    include: { user: true, role: true },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "ADD_MEMBER",
    entityType: "PROJECT",
    entityId: input.projectId,
    after: mapProjectMember(member),
  });

  return mapProjectMember(member);
}

export async function updateProjectMemberRole(input: UpdateProjectMemberRoleInputType) {
  await requirePermission(input.userId, Permission.MEMBER_MANAGE_ROLES, input.projectId);

  const project = await getActiveProject(input.projectId);
  const role = await getProjectRoleById(input.roleId);
  assertProjectMemberRoleCode(role.code);

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: input.memberUserId, projectId: input.projectId },
    },
    include: { user: true, role: true },
  });
  if (!member) {
    throw new NotFoundException("ProjectMember", input.memberUserId);
  }

  const before = mapProjectMember(member);

  if (project.ownerId === input.memberUserId && member.role.code === "MANAGER" && role.code !== "MANAGER") {
    const managerCount = await prisma.projectMember.count({
      where: { projectId: input.projectId, role: { code: "MANAGER" } },
    });
    if (managerCount <= 1) {
      throw new ValidationException("Cannot change role of the last manager who owns the project", "BAD_USER_INPUT", {
        field: "roleId",
      });
    }
  }

  const updated = await prisma.projectMember.update({
    where: { id: member.id },
    data: { roleId: input.roleId },
    include: { user: true, role: true },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE_MEMBER_ROLE",
    entityType: "PROJECT",
    entityId: input.projectId,
    before,
    after: mapProjectMember(updated),
  });

  return mapProjectMember(updated);
}

export async function removeProjectMember(input: RemoveProjectMemberInputType) {
  await requirePermission(input.userId, Permission.MEMBER_REMOVE, input.projectId);

  const project = await getActiveProject(input.projectId);

  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: input.memberUserId, projectId: input.projectId },
    },
    include: { user: true, role: true },
  });
  if (!member) {
    throw new NotFoundException("ProjectMember", input.memberUserId);
  }

  if (project.ownerId === input.memberUserId && member.role.code === "MANAGER") {
    const managerCount = await prisma.projectMember.count({
      where: { projectId: input.projectId, role: { code: "MANAGER" } },
    });
    if (managerCount <= 1) {
      throw new ValidationException("Cannot remove the owner while they are the last manager", "BAD_USER_INPUT", {
        field: "memberUserId",
      });
    }
  }

  await prisma.projectMember.delete({ where: { id: member.id } });

  await writeAuditLog({
    actorId: input.actorId,
    action: "REMOVE_MEMBER",
    entityType: "PROJECT",
    entityId: input.projectId,
    before: mapProjectMember(member),
  });

  return true;
}
