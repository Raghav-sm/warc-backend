import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";
import { TaskFilterInputSchema } from "./task";

export const GetNotificationsSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
  unreadOnly: z.boolean().optional().nullable(),
});

export type GetNotificationsInputType = z.infer<typeof GetNotificationsSchema>;

export const MarkNotificationReadSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type MarkNotificationReadInputType = z.infer<typeof MarkNotificationReadSchema>;

export const MarkAllNotificationsReadSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type MarkAllNotificationsReadInputType = z.infer<typeof MarkAllNotificationsReadSchema>;

export const GetMyTasksSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
  filters: TaskFilterInputSchema,
});

export type GetMyTasksInputType = z.infer<typeof GetMyTasksSchema>;

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  COMMENT: "COMMENT",
  MENTION: "MENTION",
} as const;

export type CreateNotificationInputType = {
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
};
