import { getPrismaInstance } from "datasources/prisma";
import type {
  GetTrashedFoldersInputType,
  GetTrashedNotesInputType,
  GetTrashedProjectsInputType,
  GetTrashedTasksInputType,
  PermanentDeleteProjectInputType,
  PermanentDeleteTaskInputType,
  RestoreFolderInputType,
  RestoreNoteInputType,
  RestoreProjectInputType,
  RestoreTaskInputType,
} from "interfaces/trash";
import { Permission, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";
import { getNote } from "schema/note/services";
import { getProject } from "schema/project/services";
import { assertCanEditTask, getTask, mapTask } from "schema/task/services";

import { assertPlatformAdmin, requirePermission } from "utils/effective-permissions";
import { NotFoundException } from "utils/errors";
import { hasProvided } from "utils/validation";

const prisma = getPrismaInstance();

const taskInclude = {
  project: true,
  createdBy: true,
  subtasks: { orderBy: { createdAt: "asc" as const } },
  assignees: {
    include: {
      user: { include: { role: true } },
    },
  },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function mapTrashedProject(
  project: Prisma.ProjectGetPayload<{ include: { owner: { select: { firstName: true; lastName: true } } } }>,
) {
  const ownerName = [project.owner.firstName, project.owner.lastName].filter(Boolean).join(" ");
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    deletedAt: project.deletedAt,
    ownerId: project.ownerId,
    ownerName: ownerName || null,
  };
}

function mapTrashedTask(task: Prisma.TaskGetPayload<{ include: { project: { select: { name: true } } } }>) {
  return {
    id: task.id,
    title: task.title,
    projectId: task.projectId,
    projectName: task.project.name,
    status: task.status,
    priority: task.priority,
    deletedAt: task.deletedAt,
  };
}

function mapTrashedNote(note: Prisma.NoteGetPayload<Record<string, never>>) {
  return {
    id: note.id,
    title: note.title,
    folderId: note.folderId,
    deletedAt: note.deletedAt,
  };
}

function mapTrashedFolder(folder: Prisma.FolderGetPayload<Record<string, never>>) {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    deletedAt: folder.deletedAt,
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

export async function getTrashedProjects(input: GetTrashedProjectsInputType) {
  const [nodes, pageInfo] = await prisma.project
    .paginate({
      where: {
        deletedAt: { not: null },
        members: { some: { userId: input.userId } },
      },
      include: {
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { deletedAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapTrashedProject),
    pageInfo,
  };
}

export async function getTrashedNotes(input: GetTrashedNotesInputType) {
  const [nodes, pageInfo] = await prisma.note
    .paginate({
      where: {
        ownerId: input.userId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapTrashedNote),
    pageInfo,
  };
}

export async function getTrashedFolders(input: GetTrashedFoldersInputType) {
  const [nodes, pageInfo] = await prisma.folder
    .paginate({
      where: {
        ownerId: input.userId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapTrashedFolder),
    pageInfo,
  };
}

export async function getTrashedTasks(input: GetTrashedTasksInputType) {
  const where: Prisma.TaskWhereInput = {
    deletedAt: { not: null },
    project: {
      deletedAt: null,
      members: { some: { userId: input.userId } },
    },
  };

  if (hasProvided(input.projectId)) {
    where.projectId = input.projectId;
  }

  const [nodes, pageInfo] = await prisma.task
    .paginate({
      where,
      include: {
        project: { select: { name: true } },
      },
      orderBy: { deletedAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapTrashedTask),
    pageInfo,
  };
}

export async function restoreProject(input: RestoreProjectInputType) {
  const project = await prisma.project.findFirst({
    where: { id: input.id, deletedAt: { not: null } },
  });
  if (!project) {
    throw new NotFoundException("Project", input.id);
  }

  await requirePermission(input.userId, Permission.PROJECT_EDIT, project.id);

  await prisma.project.update({
    where: { id: input.id },
    data: { deletedAt: null },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "RESTORE",
    entityType: "PROJECT",
    entityId: project.id,
    after: projectAuditSnapshot(project),
  });

  return getProject({ id: project.id, userId: input.userId });
}

export async function restoreNote(input: RestoreNoteInputType) {
  const note = await prisma.note.findFirst({
    where: { id: input.id, ownerId: input.userId, deletedAt: { not: null } },
  });

  if (!note) {
    throw new NotFoundException("Note", input.id);
  }

  if (note.folderId != null) {
    const folder = await prisma.folder.findFirst({
      where: { id: note.folderId, ownerId: input.userId, deletedAt: null },
    });

    if (!folder) {
      throw new NotFoundException("Folder", note.folderId);
    }
  }

  await prisma.note.update({
    where: { id: input.id },
    data: { deletedAt: null },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "RESTORE",
    entityType: "NOTE",
    entityId: note.id,
    after: {
      id: note.id,
      title: note.title,
      folderId: note.folderId,
    },
  });

  return getNote({ id: note.id, userId: input.userId });
}

export async function restoreFolder(input: RestoreFolderInputType) {
  const folder = await prisma.folder.findFirst({
    where: { id: input.id, ownerId: input.userId, deletedAt: { not: null } },
  });

  if (!folder) {
    throw new NotFoundException("Folder", input.id);
  }

  if (folder.parentId != null) {
    const parent = await prisma.folder.findFirst({
      where: { id: folder.parentId, ownerId: input.userId, deletedAt: null },
    });

    if (!parent) {
      throw new NotFoundException("Folder", folder.parentId);
    }
  }

  await prisma.folder.update({
    where: { id: input.id },
    data: { deletedAt: null },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "RESTORE",
    entityType: "FOLDER",
    entityId: folder.id,
    after: {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
    },
  });

  const noteCount = await prisma.note.count({
    where: { folderId: folder.id, ownerId: input.userId, deletedAt: null },
  });

  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    noteCount,
    children: [],
  };
}

export async function restoreTask(input: RestoreTaskInputType) {
  const task = (await prisma.task.findFirst({
    where: { id: input.id, deletedAt: { not: null } },
    include: taskInclude,
  })) as TaskWithRelations | null;

  if (!task) {
    throw new NotFoundException("Task", input.id);
  }

  await assertCanEditTask(input.userId, task);

  await prisma.task.update({
    where: { id: input.id },
    data: { deletedAt: null },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "RESTORE",
    entityType: "TASK",
    entityId: task.id,
    after: mapTask(task),
  });

  return getTask({ id: task.id, userId: input.userId });
}

export async function permanentDeleteProject(input: PermanentDeleteProjectInputType) {
  const project = await prisma.project.findFirst({
    where: { id: input.id, deletedAt: { not: null } },
  });
  if (!project) {
    throw new NotFoundException("Project", input.id);
  }

  await assertPlatformAdmin(input.userId);

  await writeAuditLog({
    actorId: input.actorId,
    action: "PERMANENT_DELETE",
    entityType: "PROJECT",
    entityId: project.id,
    before: projectAuditSnapshot(project),
  });

  await prisma.project.delete({ where: { id: input.id } });

  return true;
}

export async function permanentDeleteTask(input: PermanentDeleteTaskInputType) {
  const task = (await prisma.task.findFirst({
    where: { id: input.id, deletedAt: { not: null } },
    include: taskInclude,
  })) as TaskWithRelations | null;

  if (!task) {
    throw new NotFoundException("Task", input.id);
  }

  await assertPlatformAdmin(input.userId);

  await writeAuditLog({
    actorId: input.actorId,
    action: "PERMANENT_DELETE",
    entityType: "TASK",
    entityId: task.id,
    before: mapTask(task),
  });

  await prisma.task.delete({ where: { id: input.id } });

  return true;
}
