import { getPrismaInstance } from "datasources/prisma";
import type {
  CreateResourceInputType,
  DeleteResourceInputType,
  GetResourcesInputType,
  UpdateResourceInputType,
} from "interfaces/resource";
import { Permission, ResourceType, ResourceVisibility, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { assertProjectMember, getEffectivePermissions } from "utils/effective-permissions";
import { ForbiddenException, NotFoundException, ValidationException } from "utils/errors";

const prisma = getPrismaInstance();

type ResourceWithAccess = Prisma.ResourceGetPayload<{
  include: { access: true };
}>;

function mapResource(resource: ResourceWithAccess) {
  return {
    id: resource.id,
    projectId: resource.projectId,
    type: resource.type,
    title: resource.title,
    url: resource.url,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName,
    fileType: resource.fileType,
    size: resource.size,
    visibility: resource.visibility,
    createdById: resource.createdById,
    viewerIds: resource.access.map((a) => a.userId),
    createdAt: resource.createdAt,
  };
}

function canViewResource(resource: ResourceWithAccess, userId: string): boolean {
  if (resource.visibility === ResourceVisibility.PUBLIC) {
    return true;
  }
  if (resource.createdById === userId) {
    return true;
  }
  return resource.access.some((a) => a.userId === userId);
}

function isCloudinaryUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes("cloudinary.com");
  } catch {
    return false;
  }
}

async function assertCanManageResource(
  userId: string,
  resource: { createdById: string; projectId: string },
): Promise<void> {
  if (resource.createdById === userId) {
    return;
  }

  const permissions = await getEffectivePermissions(userId, resource.projectId);
  if (permissions.includes(Permission.PROJECT_EDIT)) {
    return;
  }

  throw new ForbiddenException("Forbidden");
}

async function assertViewerIdsAreProjectMembers(projectId: string, viewerIds: string[]): Promise<void> {
  const members = await prisma.projectMember.findMany({
    where: { projectId, userId: { in: viewerIds } },
    select: { userId: true },
  });

  if (members.length !== viewerIds.length) {
    throw new ValidationException("All viewerIds must be project members", "BAD_USER_INPUT", {
      field: "viewerIds",
    });
  }
}

async function loadResource(id: string): Promise<ResourceWithAccess> {
  const resource = await prisma.resource.findFirst({
    where: { id, deletedAt: null },
    include: { access: true },
  });
  if (!resource) {
    throw new NotFoundException("Resource", id);
  }
  return resource;
}

export async function getResources(input: GetResourcesInputType) {
  await assertProjectMember(input.userId, input.projectId);

  const resources = await prisma.resource.findMany({
    where: { projectId: input.projectId, deletedAt: null },
    include: { access: true },
    orderBy: { createdAt: "desc" },
  });

  const visible = resources.filter((r) => canViewResource(r, input.userId));

  return {
    nodes: visible.map(mapResource),
  };
}

export async function createResource(input: CreateResourceInputType) {
  await assertProjectMember(input.userId, input.projectId);

  if (input.type === ResourceType.FILE && input.fileUrl && !isCloudinaryUrl(input.fileUrl)) {
    throw new ValidationException("fileUrl must be a Cloudinary URL", "BAD_USER_INPUT", { field: "fileUrl" });
  }

  if (input.visibility === ResourceVisibility.PRIVATE && input.viewerIds) {
    await assertViewerIdsAreProjectMembers(input.projectId, input.viewerIds);
  }

  const resource = await prisma.$transaction(async (tx) => {
    const created = await tx.resource.create({
      data: {
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        url: input.type === ResourceType.LINK ? input.url : null,
        fileUrl: input.type === ResourceType.FILE ? input.fileUrl : null,
        fileName: input.type === ResourceType.FILE ? input.fileName : null,
        fileType: input.type === ResourceType.FILE ? input.fileType : null,
        size: input.type === ResourceType.FILE ? input.size : null,
        visibility: input.visibility,
        createdById: input.userId,
        ...(input.visibility === ResourceVisibility.PRIVATE && input.viewerIds
          ? {
              access: {
                create: input.viewerIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: { access: true },
    });

    await writeAuditLog(
      {
        actorId: input.actorId,
        action: "CREATE",
        entityType: "RESOURCE",
        entityId: created.id,
        after: mapResource(created),
      },
      tx,
    );

    return created;
  });

  return mapResource(resource);
}

export async function updateResource(input: UpdateResourceInputType) {
  const before = await loadResource(input.id);
  await assertCanManageResource(input.userId, before);

  if (input.viewerIds) {
    await assertViewerIdsAreProjectMembers(before.projectId, input.viewerIds);
  }

  const resource = await prisma.$transaction(async (tx) => {
    const updated = await tx.resource.update({
      where: { id: input.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      },
      include: { access: true },
    });

    if (input.visibility === ResourceVisibility.PUBLIC) {
      await tx.resourceAccess.deleteMany({ where: { resourceId: input.id } });
    } else if (input.viewerIds !== undefined) {
      const viewerIds = input.viewerIds ?? [];
      await tx.resourceAccess.deleteMany({ where: { resourceId: input.id } });

      if (viewerIds.length > 0) {
        await tx.resourceAccess.createMany({
          data: viewerIds.map((userId) => ({
            resourceId: input.id,
            userId,
          })),
        });
      }
    }

    const needsAccessReload =
      input.visibility === ResourceVisibility.PUBLIC || input.viewerIds !== undefined;

    if (needsAccessReload) {
      const withAccess = await tx.resource.findUniqueOrThrow({
        where: { id: input.id },
        include: { access: true },
      });

      await writeAuditLog(
        {
          actorId: input.actorId,
          action: "UPDATE",
          entityType: "RESOURCE",
          entityId: input.id,
          before: mapResource(before),
          after: mapResource(withAccess),
        },
        tx,
      );

      return withAccess;
    }

    await writeAuditLog(
      {
        actorId: input.actorId,
        action: "UPDATE",
        entityType: "RESOURCE",
        entityId: input.id,
        before: mapResource(before),
        after: mapResource(updated),
      },
      tx,
    );

    return updated;
  });

  return mapResource(resource);
}

export async function deleteResource(input: DeleteResourceInputType) {
  const resource = await loadResource(input.id);
  await assertCanManageResource(input.userId, resource);

  await prisma.resource.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "RESOURCE",
    entityId: input.id,
    before: mapResource(resource),
  });

  return true;
}
