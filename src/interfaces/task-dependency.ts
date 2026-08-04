import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

export const GetTaskDependenciesSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetTaskDependenciesInputType = z.infer<typeof GetTaskDependenciesSchema>;

export const AddTaskDependencySchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  dependsOnTaskId: z.uuid(MESSAGE_MAP.INVALID("dependsOnTaskId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type AddTaskDependencyInputType = z.infer<typeof AddTaskDependencySchema>;

export const RemoveTaskDependencySchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RemoveTaskDependencyInputType = z.infer<typeof RemoveTaskDependencySchema>;
