import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

const MAX_ATTACHMENT_SIZE_BYTES = 10_485_760;

const attachmentContextRefine = (data: { taskId?: string | null; commentId?: string | null }) => {
  const hasTask = data.taskId != null && data.taskId !== "";
  const hasComment = data.commentId != null && data.commentId !== "";
  return (hasTask || hasComment) && !(hasTask && hasComment);
};

const attachmentContextMessage = {
  message: "Exactly one of taskId or commentId must be provided",
  path: ["taskId"],
};

export const GetAttachmentsSchema = z
  .object({
    taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim().optional().nullable(),
    commentId: z.uuid(MESSAGE_MAP.INVALID("commentId", "UUID")).trim().optional().nullable(),
    userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  })
  .refine(attachmentContextRefine, attachmentContextMessage);

export type GetAttachmentsInputType = z.infer<typeof GetAttachmentsSchema>;

export const GetUploadSignatureSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetUploadSignatureInputType = z.infer<typeof GetUploadSignatureSchema>;

export const CreateAttachmentSchema = z
  .object({
    taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim().optional().nullable(),
    commentId: z.uuid(MESSAGE_MAP.INVALID("commentId", "UUID")).trim().optional().nullable(),
    fileUrl: z.url(MESSAGE_MAP.INVALID("fileUrl", "URL")).trim(),
    fileName: z.string(MESSAGE_MAP.REQUIRED("fileName")).trim().nonempty(MESSAGE_MAP.EMPTY("fileName")),
    fileType: z.string(MESSAGE_MAP.REQUIRED("fileType")).trim().nonempty(MESSAGE_MAP.EMPTY("fileType")),
    size: z
      .number()
      .int()
      .min(1, MESSAGE_MAP.MIN("size", 1))
      .max(MAX_ATTACHMENT_SIZE_BYTES, MESSAGE_MAP.MAX("size", MAX_ATTACHMENT_SIZE_BYTES)),
    userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
    actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
  })
  .refine(attachmentContextRefine, attachmentContextMessage);

export type CreateAttachmentInputType = z.infer<typeof CreateAttachmentSchema>;

export const DeleteAttachmentSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteAttachmentInputType = z.infer<typeof DeleteAttachmentSchema>;
