import { getPrismaInstance } from "datasources/prisma";
import type { CreateNotificationInputType } from "interfaces/notification";
import type {
  GetMyTasksInputType,
  GetNotificationsInputType,
  MarkAllNotificationsReadInputType,
  MarkNotificationReadInputType,
} from "interfaces/notification";
import type { TaskFilterInputType } from "interfaces/task";
import type { Prisma } from "prisma-client/client";

import { mapTask } from "schema/task/services";
import { getBlockedTaskIds } from "schema/task-dependency/blocking";

import { hasProvided } from "utils/validation";
import { NotFoundException } from "utils/errors";
import { publishNotificationCreated } from "utils/pubsub";

const prisma = getPrismaInstance();

const taskInclude = {
  project: true,
  createdBy: true,
  subtasks: { orderBy: { createdAt: "asc" as const } },
  assignees: {
    include: {
      user: { include: { role: true } },
    },
  },
} satisfies Prisma.TaskInclude;

function mapNotification(notification: Prisma.NotificationGetPayload<object>) {
  return {
    id: notification.id,
    type: notification.type,
    entityType: notification.entityType,
    entityId: notification.entityId,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

function buildMyTasksWhere(userId: string, filters: TaskFilterInputType = {}): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    assignees: { some: { userId } },
    project: { members: { some: { userId } } },
  };

  if (hasProvided(filters?.projectId)) {
    where.projectId = filters.projectId;
  }

  if (hasProvided(filters?.status)) {
    where.status = filters.status;
  }

  if (hasProvided(filters?.assigneeId)) {
    where.assignees = { some: { userId: filters.assigneeId } };
  }

  if (hasProvided(filters?.text)) {
    where.OR = [
      { title: { contains: filters.text, mode: "insensitive" } },
      { description: { contains: filters.text, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function createNotification(input: CreateNotificationInputType) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,
      isRead: false,
    },
  });

  const mapped = mapNotification(notification);
  await publishNotificationCreated(input.userId, mapped);

  return mapped;
}

export async function getNotifications(input: GetNotificationsInputType) {
  const where: Prisma.NotificationWhereInput = { userId: input.userId };
  if (input.unreadOnly) {
    where.isRead = false;
  }

  const [nodes, pageInfo] = await prisma.notification
    .paginate({
      where,
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  const unreadCount = await prisma.notification.count({
    where: { userId: input.userId, isRead: false },
  });

  return {
    nodes: nodes.map(mapNotification),
    pageInfo,
    unreadCount,
  };
}

export async function markNotificationRead(input: MarkNotificationReadInputType) {
  const notification = await prisma.notification.findFirst({
    where: { id: input.id, userId: input.userId },
  });
  if (!notification) {
    throw new NotFoundException("Notification", input.id);
  }

  const updated = await prisma.notification.update({
    where: { id: input.id },
    data: { isRead: true },
  });

  return mapNotification(updated);
}

export async function markAllNotificationsRead(input: MarkAllNotificationsReadInputType) {
  await prisma.notification.updateMany({
    where: { userId: input.userId, isRead: false },
    data: { isRead: true },
  });

  return true;
}

export async function getMyTasks(input: GetMyTasksInputType) {
  const [nodes, pageInfo] = await prisma.task
    .paginate({
      where: buildMyTasksWhere(input.userId, input.filters),
      include: taskInclude,
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  const taskIds = nodes.map((task) => task.id);
  const blockedIds = await getBlockedTaskIds(taskIds);

  return {
    nodes: nodes.map((task) => mapTask(task, blockedIds.has(task.id))),
    pageInfo,
  };
}
