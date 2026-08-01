import { MESSAGE_MAP } from "utils/validation";
import { z } from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const WriteAuditLogSchema = z.object({
  action: z.string(MESSAGE_MAP.REQUIRED("action")).trim(),
  entityType: z.string(MESSAGE_MAP.REQUIRED("entityType")).trim(),
  entityId: z.uuid(MESSAGE_MAP.INVALID("entityId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim().optional().nullable(),
  before: z.record(z.string(), z.unknown()).nullable().optional(),
  after: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type WriteAuditLogInputType = z.infer<typeof WriteAuditLogSchema>;

export const AuditLogFilterInputSchema = z
  .object({
    action: z.string().trim().optional().nullable(),
    entityType: z.string().trim().optional().nullable(),
    entityId: z.uuid(MESSAGE_MAP.INVALID("entityId", "UUID")).trim().optional().nullable(),
    actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim().optional().nullable(),
  })
  .optional()
  .nullable();

export type AuditLogFilterInputType = z.infer<typeof AuditLogFilterInputSchema>;

export const GetAuditLogsSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
  filters: AuditLogFilterInputSchema,
});

export type GetAuditLogsInputType = z.infer<typeof GetAuditLogsSchema>;
