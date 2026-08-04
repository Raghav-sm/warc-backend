import { getPrismaInstance } from "datasources/prisma";
import type {
  CreateTimeLogInputType,
  GetActiveTimerInputType,
  GetTimeLogsInputType,
  StartTimerInputType,
  StopTimerInputType,
} from "interfaces/time-log";
import type { Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { assertProjectMember } from "utils/effective-permissions";
import { ConflictException, NotFoundException, ValidationException } from "utils/errors";

const prisma = getPrismaInstance();

type TimeLogWithUser = Prisma.TimeLogGetPayload<{
  include: { user: { select: { firstName: true; lastName: true } } };
}>;

function mapTimeLog(log: TimeLogWithUser) {
  return {
    id: log.id,
    taskId: log.taskId,
    userId: log.userId,
    startedAt: log.startedAt,
    endedAt: log.endedAt,
    durationMinutes: log.durationMinutes,
    note: log.note,
    createdAt: log.createdAt,
    userFirstName: log.user.firstName,
    userLastName: log.user.lastName,
  };
}

async function loadTaskContext(taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: { id: true, projectId: true, title: true },
  });
  if (!task) {
    throw new NotFoundException("Task", taskId);
  }
  return task;
}

function calcDurationMinutes(startedAt: Date, endedAt: Date): number {
  return Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);
}

export async function getTimeLogs(input: GetTimeLogsInputType) {
  const task = await loadTaskContext(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  const [nodes] = await prisma.timeLog
    .paginate({
      where: { taskId: input.taskId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { startedAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  const allLogs = await prisma.timeLog.findMany({
    where: { taskId: input.taskId },
    select: { durationMinutes: true },
  });
  const totalMinutes = allLogs.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0);

  return {
    nodes: nodes.map(mapTimeLog),
    totalMinutes,
  };
}

export async function getActiveTimer(input: GetActiveTimerInputType) {
  const openLog = await prisma.timeLog.findFirst({
    where: { userId: input.userId, endedAt: null },
  });
  if (!openLog) {
    return null;
  }

  const task = await loadTaskContext(openLog.taskId);

  return {
    id: openLog.id,
    taskId: openLog.taskId,
    taskTitle: task.title,
    startedAt: openLog.startedAt,
  };
}

export async function startTimer(input: StartTimerInputType) {
  const task = await loadTaskContext(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  const existing = await prisma.timeLog.findFirst({
    where: { userId: input.userId, endedAt: null },
  });
  if (existing) {
    throw new ConflictException("Timer already running", "CONFLICT");
  }

  const created = await prisma.timeLog.create({
    data: {
      taskId: input.taskId,
      userId: input.userId,
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "TIME_LOG",
    entityId: created.id,
    metadata: { action: "start_timer", taskId: input.taskId },
  });

  return getActiveTimer({ userId: input.userId });
}

export async function stopTimer(input: StopTimerInputType) {
  const openLog = await prisma.timeLog.findFirst({
    where: { userId: input.userId, endedAt: null },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!openLog) {
    throw new NotFoundException("Active timer");
  }

  const endedAt = new Date();
  const durationMinutes = calcDurationMinutes(openLog.startedAt, endedAt);

  const updated = await prisma.timeLog.update({
    where: { id: openLog.id },
    data: { endedAt, durationMinutes },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "TIME_LOG",
    entityId: updated.id,
    after: mapTimeLog(updated),
    metadata: { action: "stop_timer" },
  });

  return mapTimeLog(updated);
}

export async function createTimeLog(input: CreateTimeLogInputType) {
  const task = await loadTaskContext(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  if (input.endedAt <= input.startedAt) {
    throw new ValidationException("endedAt must be after startedAt", "BAD_USER_INPUT", { field: "endedAt" });
  }

  const durationMinutes = calcDurationMinutes(input.startedAt, input.endedAt);

  const log = await prisma.timeLog.create({
    data: {
      taskId: input.taskId,
      userId: input.userId,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationMinutes,
      note: input.note ?? null,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "TIME_LOG",
    entityId: log.id,
    after: mapTimeLog(log),
  });

  return mapTimeLog(log);
}
