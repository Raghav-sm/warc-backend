import { getPrismaInstance } from "datasources/prisma";
import type {
  CreateAttachmentInputType,
  DeleteAttachmentInputType,
  GetAttachmentsInputType,
  GetUploadSignatureInputType,
} from "interfaces/attachment";
import { Permission, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { generateUploadSignature } from "utils/cloudinary";
import { assertProjectMember, getEffectivePermissions } from "utils/effective-permissions";
import { ForbiddenException, NotFoundException, ValidationException } from "utils/errors";

const prisma = getPrismaInstance();

type AttachmentWithUploader = Prisma.AttachmentGetPayload<{
  include: { uploadedBy: { select: { firstName: true; lastName: true } } };
}>;

function mapAttachment(attachment: AttachmentWithUploader) {
  return {
    id: attachment.id,
    taskId: attachment.taskId,
    commentId: attachment.commentId,
    fileUrl: attachment.fileUrl,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    size: attachment.size,
    uploadedById: attachment.uploadedById,
    uploadedByFirstName: attachment.uploadedBy.firstName,
    uploadedByLastName: attachment.uploadedBy.lastName,
    createdAt: attachment.createdAt,
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

type AttachmentContext = {
  projectId: string;
  taskId: string | null;
  commentId: string | null;
};

async function resolveAttachmentContext(
  taskId?: string | null,
  commentId?: string | null,
): Promise<AttachmentContext> {
  if (taskId) {
    const task = await loadTaskContext(taskId);
    return { projectId: task.projectId, taskId, commentId: null };
  }

  if (commentId) {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException("Comment", commentId);
    }
    const task = await loadTaskContext(comment.taskId);
    return { projectId: task.projectId, taskId: task.id, commentId };
  }

  throw new ValidationException("taskId or commentId required", "BAD_USER_INPUT");
}

function isCloudinaryUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes("cloudinary.com");
  } catch {
    return false;
  }
}

async function assertCanDeleteAttachment(
  userId: string,
  attachment: { uploadedById: string },
  projectId: string,
): Promise<void> {
  if (attachment.uploadedById === userId) {
    return;
  }

  const permissions = await getEffectivePermissions(userId, projectId);
  if (permissions.includes(Permission.TASK_EDIT_ANY)) {
    return;
  }

  throw new ForbiddenException("Forbidden");
}

export async function getAttachments(input: GetAttachmentsInputType) {
  const ctx = await resolveAttachmentContext(input.taskId, input.commentId);
  await assertProjectMember(input.userId, ctx.projectId);

  const where = input.taskId ? { taskId: input.taskId } : { commentId: input.commentId! };

  const attachments = await prisma.attachment.findMany({
    where,
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    nodes: attachments.map(mapAttachment),
  };
}

export async function getUploadSignature(input: GetUploadSignatureInputType) {
  await assertProjectMember(input.userId, input.projectId);
  return generateUploadSignature();
}

export async function createAttachment(input: CreateAttachmentInputType) {
  const ctx = await resolveAttachmentContext(input.taskId, input.commentId);
  await assertProjectMember(input.userId, ctx.projectId);

  if (!isCloudinaryUrl(input.fileUrl)) {
    throw new ValidationException("fileUrl must be a Cloudinary URL", "BAD_USER_INPUT", { field: "fileUrl" });
  }

  const attachment = await prisma.attachment.create({
    data: {
      taskId: ctx.taskId,
      commentId: ctx.commentId,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileType: input.fileType,
      size: input.size,
      uploadedById: input.userId,
    },
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "ATTACHMENT",
    entityId: attachment.id,
    after: mapAttachment(attachment),
  });

  return mapAttachment(attachment);
}

export async function deleteAttachment(input: DeleteAttachmentInputType) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: input.id },
    include: { uploadedBy: { select: { firstName: true, lastName: true } } },
  });
  if (!attachment) {
    throw new NotFoundException("Attachment", input.id);
  }

  const ctx = await resolveAttachmentContext(attachment.taskId, attachment.commentId);
  await assertCanDeleteAttachment(input.userId, attachment, ctx.projectId);

  await prisma.attachment.delete({ where: { id: input.id } });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "ATTACHMENT",
    entityId: input.id,
    before: mapAttachment(attachment),
  });

  return true;
}
