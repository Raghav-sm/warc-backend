import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

const NOTE_ENTITY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const NOTE_ENTITY_NAME_MESSAGE = "Use only letters, numbers, hyphens, and underscores (no spaces)";

const folderNameSchema = z
  .string(MESSAGE_MAP.REQUIRED("name"))
  .trim()
  .min(1, MESSAGE_MAP.MIN("name", 1))
  .max(100, MESSAGE_MAP.MAX("name", 100))
  .regex(NOTE_ENTITY_NAME_REGEX, NOTE_ENTITY_NAME_MESSAGE);

const noteTitleSchema = z
  .string(MESSAGE_MAP.REQUIRED("title"))
  .trim()
  .min(1, MESSAGE_MAP.MIN("title", 1))
  .max(200, MESSAGE_MAP.MAX("title", 200))
  .regex(NOTE_ENTITY_NAME_REGEX, NOTE_ENTITY_NAME_MESSAGE);

export const CreateFolderSchema = z.object({
  name: folderNameSchema,
  parentId: z.uuid(MESSAGE_MAP.INVALID("parentId", "UUID")).trim().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type CreateFolderInputType = z.infer<typeof CreateFolderSchema>;

export const UpdateFolderSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  name: folderNameSchema.optional(),
  parentId: z.uuid(MESSAGE_MAP.INVALID("parentId", "UUID")).trim().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type UpdateFolderInputType = z.infer<typeof UpdateFolderSchema>;

export const DeleteFolderSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type DeleteFolderInputType = z.infer<typeof DeleteFolderSchema>;

export const GetFoldersSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetFoldersInputType = z.infer<typeof GetFoldersSchema>;

export const CreateNoteSchema = z.object({
  title: noteTitleSchema,
  content: z.string().default(""),
  folderId: z.uuid(MESSAGE_MAP.INVALID("folderId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type CreateNoteInputType = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  title: noteTitleSchema.optional(),
  content: z.string().optional(),
  folderId: z.uuid(MESSAGE_MAP.INVALID("folderId", "UUID")).trim().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type UpdateNoteInputType = z.infer<typeof UpdateNoteSchema>;

export const DeleteNoteSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type DeleteNoteInputType = z.infer<typeof DeleteNoteSchema>;

export const GetNotesSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  folderId: z.uuid(MESSAGE_MAP.INVALID("folderId", "UUID")).trim().optional().nullable(),
  all: z.boolean().optional(),
});

export type GetNotesInputType = z.infer<typeof GetNotesSchema>;

export const GetNoteSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetNoteInputType = z.infer<typeof GetNoteSchema>;
