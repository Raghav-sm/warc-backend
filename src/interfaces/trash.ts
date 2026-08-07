import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetTrashedProjectsSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
});

export type GetTrashedProjectsInputType = z.infer<typeof GetTrashedProjectsSchema>;

export const GetTrashedTasksSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim().optional().nullable(),
});

export type GetTrashedTasksInputType = z.infer<typeof GetTrashedTasksSchema>;

export const RestoreProjectSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RestoreProjectInputType = z.infer<typeof RestoreProjectSchema>;

export const RestoreTaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RestoreTaskInputType = z.infer<typeof RestoreTaskSchema>;

export const PermanentDeleteProjectSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type PermanentDeleteProjectInputType = z.infer<typeof PermanentDeleteProjectSchema>;

export const PermanentDeleteTaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type PermanentDeleteTaskInputType = z.infer<typeof PermanentDeleteTaskSchema>;

export const GetTrashedNotesSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
});

export type GetTrashedNotesInputType = z.infer<typeof GetTrashedNotesSchema>;

export const GetTrashedFoldersSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
});

export type GetTrashedFoldersInputType = z.infer<typeof GetTrashedFoldersSchema>;

export const RestoreNoteSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RestoreNoteInputType = z.infer<typeof RestoreNoteSchema>;

export const RestoreFolderSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RestoreFolderInputType = z.infer<typeof RestoreFolderSchema>;
