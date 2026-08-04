import { getPrismaInstance } from "datasources/prisma";
import type {
  CreateCommentInputType,
  DeleteCommentInputType,
  GetCommentsInputType,
  UpdateCommentInputType,
} from "interfaces/comment";
import { Permission, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";
import { createNotification } from "schema/notification/services";

import { assertProjectMember, getEffectivePermissions } from "utils/effective-permissions";
import { ForbiddenException, NotFoundException } from "utils/errors";

const prisma = getPrismaInstance();

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { select: { firstName: true; lastName: true } } };
}>;

type TaskWithAssignees = Prisma.TaskGetPayload<{
  include: { assignees: true };
}>;

function mapComment(comment: CommentWithAuthor) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    authorId: comment.authorId,
    authorFirstName: comment.author.firstName,
    authorLastName: comment.author.lastName,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

async function loadTaskContext(taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: { id: true, projectId: true, title: true },
  });
  if (!task) {
    throw new NotFoundException("Task", taskId);
  }
  return task;
}

async function loadTaskWithAssignees(taskId: string): Promise<TaskWithAssignees> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: { assignees: true },
  });
  if (!task) {
    throw new NotFoundException("Task", taskId);
  }
  return task;
}

async function assertCanEditComment(
  userId: string,
  comment: { authorId: string },
  projectId: string,
): Promise<void> {
  if (comment.authorId === userId) {
    return;
  }

  const permissions = await getEffectivePermissions(userId, projectId);
  if (permissions.includes(Permission.TASK_EDIT_ANY)) {
    return;
  }

  throw new ForbiddenException("Forbidden");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function extractMentionedUserIds(body: string, projectId: string): Promise<string[]> {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });

  const mentionedIds: string[] = [];

  for (const member of members) {
    const { user } = member;
    const patterns = [
      `@${user.email}`,
      `@${user.firstName}`,
      `@${user.firstName} ${user.lastName}`.trim(),
    ].filter(Boolean);

    for (const pattern of patterns) {
      const regex = new RegExp(`(?:^|\\s)${escapeRegExp(pattern)}(?=\\s|$|[.,!?])`, "i");
      if (regex.test(body)) {
        mentionedIds.push(user.id);
        break;
      }
    }
  }

  return [...new Set(mentionedIds)];
}

async function notifyCommentRecipients({
  task,
  authorId,
  body,
}: {
  task: TaskWithAssignees & { title: string; projectId: string };
  authorId: string;
  body: string;
}): Promise<void> {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { firstName: true, lastName: true },
  });
  const authorName = author
    ? [author.firstName, author.lastName].filter(Boolean).join(" ")
    : "Someone";

  const assigneeIds = task.assignees.map((a) => a.userId).filter((id) => id !== authorId);
  const mentionIds = (await extractMentionedUserIds(body, task.projectId)).filter((id) => id !== authorId);
  const recipientIds = [...new Set([...assigneeIds, ...mentionIds])];

  for (const recipientId of recipientIds) {
    const type = mentionIds.includes(recipientId) ? "MENTION" : "COMMENT";
    await createNotification({
      userId: recipientId,
      type,
      entityType: "TASK",
      entityId: task.id,
      message: `${authorName} commented on ${task.title}`,
    });
  }
}

export async function getComments(input: GetCommentsInputType) {
  const task = await loadTaskContext(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  const [nodes, pageInfo] = await prisma.comment
    .paginate({
      where: { taskId: input.taskId, deletedAt: null },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "asc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapComment),
    pageInfo,
  };
}

export async function createComment(input: CreateCommentInputType) {
  const task = await loadTaskWithAssignees(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  const comment = await prisma.comment.create({
    data: {
      taskId: input.taskId,
      authorId: input.userId,
      body: input.body.trim(),
    },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "COMMENT",
    entityId: comment.id,
    after: mapComment(comment),
  });

  await notifyCommentRecipients({
    task,
    authorId: input.userId,
    body: input.body,
  });

  return mapComment(comment);
}

export async function updateComment(input: UpdateCommentInputType) {
  const comment = await prisma.comment.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!comment) {
    throw new NotFoundException("Comment", input.id);
  }

  const task = await loadTaskContext(comment.taskId);
  await assertCanEditComment(input.userId, comment, task.projectId);

  const updated = await prisma.comment.update({
    where: { id: input.id },
    data: { body: input.body.trim() },
    include: { author: { select: { firstName: true, lastName: true } } },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "COMMENT",
    entityId: updated.id,
    before: mapComment(comment),
    after: mapComment(updated),
  });

  return mapComment(updated);
}

export async function deleteComment(input: DeleteCommentInputType) {
  const comment = await prisma.comment.findFirst({
    where: { id: input.id, deletedAt: null },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  if (!comment) {
    throw new NotFoundException("Comment", input.id);
  }

  const task = await loadTaskContext(comment.taskId);
  await assertCanEditComment(input.userId, comment, task.projectId);

  await prisma.comment.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "COMMENT",
    entityId: input.id,
    before: mapComment(comment),
  });

  return true;
}
