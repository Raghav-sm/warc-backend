import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

const COMMENT_BODY_MAX_LENGTH = 5000;

export const CommentBodySchema = z
  .string(MESSAGE_MAP.REQUIRED("body"))
  .trim()
  .nonempty(MESSAGE_MAP.EMPTY("body"))
  .max(COMMENT_BODY_MAX_LENGTH, MESSAGE_MAP.MAX_LENGTH("body", COMMENT_BODY_MAX_LENGTH));

export const GetCommentsSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
});

export type GetCommentsInputType = z.infer<typeof GetCommentsSchema>;

export const CreateCommentSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  body: CommentBodySchema,
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateCommentInputType = z.infer<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  body: CommentBodySchema,
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateCommentInputType = z.infer<typeof UpdateCommentSchema>;

export const DeleteCommentSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteCommentInputType = z.infer<typeof DeleteCommentSchema>;
