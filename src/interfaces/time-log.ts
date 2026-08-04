import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetTimeLogsSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
});

export type GetTimeLogsInputType = z.infer<typeof GetTimeLogsSchema>;

export const StartTimerSchema = z.object({
  taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type StartTimerInputType = z.infer<typeof StartTimerSchema>;

export const StopTimerSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type StopTimerInputType = z.infer<typeof StopTimerSchema>;

export const CreateTimeLogSchema = z
  .object({
    taskId: z.uuid(MESSAGE_MAP.INVALID("taskId", "UUID")).trim(),
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date(),
    note: z.string().trim().optional().nullable(),
    userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
    actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
  })
  .refine((data) => data.endedAt > data.startedAt, {
    message: "endedAt must be after startedAt",
    path: ["endedAt"],
  });

export type CreateTimeLogInputType = z.infer<typeof CreateTimeLogSchema>;

export const GetActiveTimerSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetActiveTimerInputType = z.infer<typeof GetActiveTimerSchema>;
