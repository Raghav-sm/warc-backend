import { getPrismaInstance } from "datasources/prisma";
import type {
  CreateFolderInputType,
  CreateNoteInputType,
  DeleteFolderInputType,
  DeleteNoteInputType,
  GetFoldersInputType,
  GetNoteInputType,
  GetNotesInputType,
  UpdateFolderInputType,
  UpdateNoteInputType,
} from "interfaces/note";
import type { Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { NotFoundException, ValidationException } from "utils/errors";
import { hasProvided } from "utils/validation";

const prisma = getPrismaInstance();

type FolderRecord = Prisma.FolderGetPayload<Record<string, never>>;
type NoteRecord = Prisma.NoteGetPayload<Record<string, never>>;

type FolderTreeNode = {
  id: string;
  name: string;
  parentId: string | null;
  noteCount: number;
  children: FolderTreeNode[];
};

function mapFolder(folder: Pick<FolderRecord, "id" | "name" | "parentId">) {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
  };
}

function mapNote(note: NoteRecord) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    folderId: note.folderId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function toFolderResponse(
  folder: Pick<FolderRecord, "id" | "name" | "parentId">,
  noteCount = 0,
  children: FolderTreeNode[] = [],
): FolderTreeNode {
  return {
    ...mapFolder(folder),
    noteCount,
    children,
  };
}

function buildChildrenMap(folders: FolderRecord[]): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();

  for (const folder of folders) {
    if (folder.parentId == null) {
      continue;
    }

    const siblings = childrenMap.get(folder.parentId) ?? [];
    siblings.push(folder.id);
    childrenMap.set(folder.parentId, siblings);
  }

  return childrenMap;
}

function buildParentMap(folders: FolderRecord[]): Map<string, string | null> {
  return new Map(folders.map((folder) => [folder.id, folder.parentId]));
}

function isDescendant(folderId: string, ancestorId: string, parentMap: Map<string, string | null>): boolean {
  let current = parentMap.get(folderId);

  while (current != null) {
    if (current === ancestorId) {
      return true;
    }
    current = parentMap.get(current) ?? null;
  }

  return false;
}

function collectDescendantIds(folderId: string, childrenMap: Map<string, string[]>): string[] {
  const result: string[] = [];
  const stack = [...(childrenMap.get(folderId) ?? [])];

  while (stack.length > 0) {
    const id = stack.pop()!;
    result.push(id);
    stack.push(...(childrenMap.get(id) ?? []));
  }

  return result;
}

function buildFolderTree(
  folders: FolderRecord[],
  noteCountByFolderId: Map<string, number>,
): FolderTreeNode[] {
  const byParent = new Map<string | null, FolderRecord[]>();

  for (const folder of folders) {
    const key = folder.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(folder);
    byParent.set(key, siblings);
  }

  function buildNode(folder: FolderRecord): FolderTreeNode {
    const children = (byParent.get(folder.id) ?? []).map(buildNode);
    return toFolderResponse(folder, noteCountByFolderId.get(folder.id) ?? 0, children);
  }

  return (byParent.get(null) ?? []).map(buildNode);
}

async function assertOwnsFolder(userId: string, folderId: string): Promise<FolderRecord> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ownerId: userId, deletedAt: null },
  });

  if (!folder) {
    throw new NotFoundException("Folder", folderId);
  }

  return folder;
}

async function assertOwnsNote(userId: string, noteId: string): Promise<NoteRecord> {
  const note = await prisma.note.findFirst({
    where: { id: noteId, ownerId: userId, deletedAt: null },
  });

  if (!note) {
    throw new NotFoundException("Note", noteId);
  }

  return note;
}

async function loadNoteCountsByFolderId(userId: string): Promise<Map<string, number>> {
  const counts = await prisma.note.groupBy({
    by: ["folderId"],
    where: {
      ownerId: userId,
      deletedAt: null,
      folderId: { not: null },
    },
    _count: { _all: true },
  });

  const noteCountByFolderId = new Map<string, number>();

  for (const row of counts) {
    if (row.folderId != null) {
      noteCountByFolderId.set(row.folderId, row._count._all);
    }
  }

  return noteCountByFolderId;
}

export async function getFolders(input: GetFoldersInputType) {
  const folders = await prisma.folder.findMany({
    where: { ownerId: input.userId, deletedAt: null },
    orderBy: { name: "asc" },
  });

  const noteCountByFolderId = await loadNoteCountsByFolderId(input.userId);

  return {
    nodes: buildFolderTree(folders, noteCountByFolderId),
  };
}

export async function createFolder(input: CreateFolderInputType) {
  if (hasProvided(input.parentId)) {
    await assertOwnsFolder(input.userId, input.parentId);
  }

  const folder = await prisma.$transaction(async (tx) => {
    const created = await tx.folder.create({
      data: {
        name: input.name,
        parentId: input.parentId ?? null,
        ownerId: input.userId,
      },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "CREATE",
        entityType: "FOLDER",
        entityId: created.id,
        after: mapFolder(created),
      },
      tx,
    );

    return created;
  });

  return toFolderResponse(folder);
}

export async function updateFolder(input: UpdateFolderInputType) {
  const folder = await assertOwnsFolder(input.userId, input.id);
  const allFolders = await prisma.folder.findMany({
    where: { ownerId: input.userId, deletedAt: null },
    select: { id: true, parentId: true },
  });

  if (hasProvided(input.parentId)) {
    if (input.parentId === input.id) {
      throw new ValidationException("A folder cannot be its own parent", "BAD_USER_INPUT", {
        parentId: ["A folder cannot be its own parent"],
      });
    }

    if (input.parentId != null) {
      await assertOwnsFolder(input.userId, input.parentId);

      const parentMap = buildParentMap(allFolders as FolderRecord[]);
      if (isDescendant(input.parentId, input.id, parentMap)) {
        throw new ValidationException("A folder cannot be moved into its own descendant", "BAD_USER_INPUT", {
          parentId: ["A folder cannot be moved into its own descendant"],
        });
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.folder.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "UPDATE",
        entityType: "FOLDER",
        entityId: input.id,
        before: mapFolder(folder),
        after: mapFolder(result),
      },
      tx,
    );

    return result;
  });

  const noteCountByFolderId = await loadNoteCountsByFolderId(input.userId);

  return toFolderResponse(updated, noteCountByFolderId.get(updated.id) ?? 0);
}

export async function deleteFolder(input: DeleteFolderInputType) {
  const folder = await assertOwnsFolder(input.userId, input.id);
  const allFolders = await prisma.folder.findMany({
    where: { ownerId: input.userId, deletedAt: null },
    select: { id: true, parentId: true },
  });

  const childrenMap = buildChildrenMap(allFolders as FolderRecord[]);
  const descendantIds = collectDescendantIds(input.id, childrenMap);
  const folderIdsToDelete = [input.id, ...descendantIds];
  const deletedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.folder.updateMany({
      where: { id: { in: folderIdsToDelete } },
      data: { deletedAt },
    });

    await tx.note.updateMany({
      where: { folderId: { in: folderIdsToDelete }, deletedAt: null },
      data: { deletedAt },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "DELETE",
        entityType: "FOLDER",
        entityId: input.id,
        before: mapFolder(folder),
      },
      tx,
    );
  });

  return true;
}

export async function getNotes(input: GetNotesInputType) {
  const where: Prisma.NoteWhereInput = {
    ownerId: input.userId,
    deletedAt: null,
  };

  if (input.all) {
    // Return all notes regardless of folder.
  } else if (input.folderId !== undefined) {
    where.folderId = input.folderId;
  } else {
    where.folderId = null;
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return {
    nodes: notes.map(mapNote),
  };
}

export async function getNote(input: GetNoteInputType) {
  const note = await assertOwnsNote(input.userId, input.id);
  return mapNote(note);
}

export async function createNote(input: CreateNoteInputType) {
  if (hasProvided(input.folderId)) {
    await assertOwnsFolder(input.userId, input.folderId);
  }

  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.note.create({
      data: {
        title: input.title,
        content: input.content,
        folderId: input.folderId ?? null,
        ownerId: input.userId,
      },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "CREATE",
        entityType: "NOTE",
        entityId: created.id,
        after: mapNote(created),
      },
      tx,
    );

    return created;
  });

  return mapNote(note);
}

export async function updateNote(input: UpdateNoteInputType) {
  const note = await assertOwnsNote(input.userId, input.id);

  if (hasProvided(input.folderId) && input.folderId != null) {
    await assertOwnsFolder(input.userId, input.folderId);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.note.update({
      where: { id: input.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
      },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "UPDATE",
        entityType: "NOTE",
        entityId: input.id,
        before: mapNote(note),
        after: mapNote(result),
      },
      tx,
    );

    return result;
  });

  return mapNote(updated);
}

export async function deleteNote(input: DeleteNoteInputType) {
  const note = await assertOwnsNote(input.userId, input.id);

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog(
      {
        actorId: input.userId,
        action: "DELETE",
        entityType: "NOTE",
        entityId: input.id,
        before: mapNote(note),
      },
      tx,
    );
  });

  return true;
}
