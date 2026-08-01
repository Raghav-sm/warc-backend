import { TaskPriority, TaskStatus, TaskType } from "prisma-client/enums";
import { MESSAGE_MAP, VALIDATION_RULES } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetTaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetTaskInputType = z.infer<typeof GetTaskSchema>;

export const TaskFilterInputSchema = z
  .object({
    projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim().optional().nullable(),
    status: z.enum(TaskStatus, MESSAGE_MAP.INVALID("status", "Task Status")).optional().nullable(),
    assigneeId: z.uuid(MESSAGE_MAP.INVALID("assigneeId", "UUID")).trim().optional().nullable(),
    text: z.string().trim().optional().nullable(),
  })
  .optional()
  .nullable();

export type TaskFilterInputType = z.infer<typeof TaskFilterInputSchema>;

export const GetTasksSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
  filters: TaskFilterInputSchema,
});

export type GetTasksInputType = z.infer<typeof GetTasksSchema>;

export const CreateTaskSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  title: z
    .string(MESSAGE_MAP.REQUIRED("title"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("title"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  description: z
    .string()
    .trim()
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  type: z.enum(TaskType, MESSAGE_MAP.INVALID("type", "Task Type")).optional().nullable(),
  weight: z.number().int().min(0).max(100),
  priority: z.enum(TaskPriority, MESSAGE_MAP.INVALID("priority", "Task Priority")).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateTaskInputType = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  title: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("title"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  type: z.enum(TaskType, MESSAGE_MAP.INVALID("type", "Task Type")).optional().nullable(),
  weight: z.number().int().min(0).max(100).optional().nullable(),
  progress: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(TaskStatus, MESSAGE_MAP.INVALID("status", "Task Status")).optional().nullable(),
  priority: z.enum(TaskPriority, MESSAGE_MAP.INVALID("priority", "Task Priority")).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateTaskInputType = z.infer<typeof UpdateTaskSchema>;

export const DeleteTaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteTaskInputType = z.infer<typeof DeleteTaskSchema>;

export const AddTaskAssigneeSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  assigneeId: z.uuid(MESSAGE_MAP.INVALID("assigneeId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type AddTaskAssigneeInputType = z.infer<typeof AddTaskAssigneeSchema>;

export const RemoveTaskAssigneeSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  assigneeId: z.uuid(MESSAGE_MAP.INVALID("assigneeId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RemoveTaskAssigneeInputType = z.infer<typeof RemoveTaskAssigneeSchema>;

export const CreateSubtaskSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  title: z
    .string(MESSAGE_MAP.REQUIRED("title"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("title"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  weight: z.number().int().min(0).max(100),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateSubtaskInputType = z.infer<typeof CreateSubtaskSchema>;

export const UpdateSubtaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  title: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("title"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  weight: z.number().int().min(0).max(100).optional().nullable(),
  isComplete: z.boolean().optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateSubtaskInputType = z.infer<typeof UpdateSubtaskSchema>;

export const DeleteSubtaskSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteSubtaskInputType = z.infer<typeof DeleteSubtaskSchema>;
