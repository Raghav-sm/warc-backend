import { getPrismaInstance } from "datasources/prisma";
import { TaskStatus } from "prisma-client/client";

import { ValidationException } from "utils/errors";

const prisma = getPrismaInstance();

export async function isTaskBlocked(taskId: string): Promise<boolean> {
  const blockedBy = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: { select: { status: true } },
    },
  });

  return blockedBy.some((dep) => dep.dependsOnTask.status !== TaskStatus.DONE);
}

export async function assertTaskNotBlockedForCompletion(taskId: string): Promise<void> {
  const blockedBy = await prisma.taskDependency.findMany({
    where: { taskId },
    include: {
      dependsOnTask: { select: { title: true, status: true } },
    },
  });

  const unfinished = blockedBy.filter((dep) => dep.dependsOnTask.status !== TaskStatus.DONE);
  if (unfinished.length === 0) {
    return;
  }

  const titles = unfinished.map((dep) => dep.dependsOnTask.title).join(", ");
  throw new ValidationException(`Task is blocked by: ${titles}`, "BAD_USER_INPUT");
}

export async function getBlockedTaskIds(taskIds: string[]): Promise<Set<string>> {
  if (taskIds.length === 0) {
    return new Set();
  }

  const deps = await prisma.taskDependency.findMany({
    where: { taskId: { in: taskIds } },
    include: {
      dependsOnTask: { select: { status: true } },
    },
  });

  const blocked = new Set<string>();
  for (const dep of deps) {
    if (dep.dependsOnTask.status !== TaskStatus.DONE) {
      blocked.add(dep.taskId);
    }
  }

  return blocked;
}
