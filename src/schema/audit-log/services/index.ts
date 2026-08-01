import { getPrismaInstance, type PrismaInteractiveTransactionClient } from "datasources/prisma";
import {
  type AuditLogFilterInputType,
  type GetAuditLogsInputType,
  type WriteAuditLogInputType,
  WriteAuditLogSchema,
} from "interfaces/audit-logs";
import type { Prisma } from "prisma-client/client";

import { withValidation } from "utils/validation";

const prisma = getPrismaInstance();

const SANITIZED_KEYS = new Set(["password", "passwordHash", "tokenHash"]);

type Payload = Record<string, unknown> | null;

function sanitizePayload(payload?: Payload) {
  if (!payload) return undefined;
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !SANITIZED_KEYS.has(key)));
}

export async function writeAuditLog(input: WriteAuditLogInputType, tx?: PrismaInteractiveTransactionClient) {
  const db = tx ?? prisma;
  function createAuditLog(input: WriteAuditLogInputType) {
    return db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        before: sanitizePayload(input.before) as Parameters<typeof db.auditLog.create>[0]["data"]["before"],
        after: sanitizePayload(input.after) as Parameters<typeof db.auditLog.create>[0]["data"]["after"],
        metadata: sanitizePayload(input.metadata) as Parameters<typeof db.auditLog.create>[0]["data"]["metadata"],
      },
    });
  }

  return withValidation(createAuditLog)(input, WriteAuditLogSchema);
}

function buildAuditLogWhere(filters: AuditLogFilterInputType = {}): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters?.action) where.action = filters.action;
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.entityId) where.entityId = filters.entityId;
  if (filters?.actorId) where.actorId = filters.actorId;

  return where;
}

export async function getAuditLogs(input: GetAuditLogsInputType) {
  const [nodes, pageInfo] = await prisma.auditLog
    .paginate({
      where: buildAuditLogWhere(input.filters),
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return { nodes, pageInfo };
}
