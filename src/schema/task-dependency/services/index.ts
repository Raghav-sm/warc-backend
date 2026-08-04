import { getPrismaInstance } from "datasources/prisma";
import type {
  AddTaskDependencyInputType,
  GetTaskDependenciesInputType,
  RemoveTaskDependencyInputType,
} from "interfaces/task-dependency";
import { TaskStatus, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";
import { assertCanEditTask, loadTaskWithProject } from "schema/task/services";

import { assertProjectMember } from "utils/effective-permissions";
import { ConflictException, NotFoundException, ValidationException } from "utils/errors";

export { assertTaskNotBlockedForCompletion, getBlockedTaskIds, isTaskBlocked } from "../blocking";

const prisma = getPrismaInstance();

type DependencyWithTasks = Prisma.TaskDependencyGetPayload<{
  include: {
    task: { select: { id: true; title: true; status: true } };
    dependsOnTask: { select: { id: true; title: true; status: true } };
  };
}>;

function mapDependencyItem(dep: DependencyWithTasks, perspective: "blockedBy" | "blocks") {
  if (perspective === "blockedBy") {
    return {
      id: dep.id,
      taskId: dep.taskId,
      dependsOnTaskId: dep.dependsOnTaskId,
      taskTitle: dep.task.title,
      dependsOnTaskTitle: dep.dependsOnTask.title,
      dependsOnTaskStatus: dep.dependsOnTask.status,
    };
  }

  return {
    id: dep.id,
    taskId: dep.taskId,
    dependsOnTaskId: dep.dependsOnTaskId,
    taskTitle: dep.task.title,
    dependsOnTaskTitle: dep.dependsOnTask.title,
    dependsOnTaskStatus: dep.task.status,
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

async function wouldCreateCycle(taskId: string, dependsOnTaskId: string): Promise<boolean> {
  const queue = [dependsOnTaskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (current === taskId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnTaskId: true },
    });
    for (const dep of deps) {
      queue.push(dep.dependsOnTaskId);
    }
  }

  return false;
}

export async function getTaskDependencies(input: GetTaskDependenciesInputType) {
  const task = await loadTaskContext(input.taskId);
  await assertProjectMember(input.userId, task.projectId);

  const blockedBy = await prisma.taskDependency.findMany({
    where: { taskId: input.taskId },
    include: {
      task: { select: { id: true, title: true, status: true } },
      dependsOnTask: { select: { id: true, title: true, status: true } },
    },
  });

  const blocks = await prisma.taskDependency.findMany({
    where: { dependsOnTaskId: input.taskId },
    include: {
      task: { select: { id: true, title: true, status: true } },
      dependsOnTask: { select: { id: true, title: true, status: true } },
    },
  });

  const isBlocked = blockedBy.some((dep) => dep.dependsOnTask.status !== TaskStatus.DONE);

  return {
    blocks: blocks.map((dep) => mapDependencyItem(dep, "blocks")),
    blockedBy: blockedBy.map((dep) => mapDependencyItem(dep, "blockedBy")),
    isBlocked,
  };
}

export async function addTaskDependency(input: AddTaskDependencyInputType) {
  if (input.taskId === input.dependsOnTaskId) {
    throw new ValidationException("Task cannot depend on itself", "BAD_USER_INPUT", { field: "dependsOnTaskId" });
  }

  const taskA = await loadTaskWithProject(input.taskId);
  const taskB = await loadTaskWithProject(input.dependsOnTaskId);

  if (taskA.projectId !== taskB.projectId) {
    throw new ValidationException("Tasks must be in the same project", "BAD_USER_INPUT", { field: "dependsOnTaskId" });
  }

  await assertCanEditTask(input.userId, taskA);

  if (await wouldCreateCycle(input.taskId, input.dependsOnTaskId)) {
    throw new ConflictException("Circular dependency", "CONFLICT");
  }

  const existing = await prisma.taskDependency.findFirst({
    where: { taskId: input.taskId, dependsOnTaskId: input.dependsOnTaskId },
  });
  if (existing) {
    throw new ConflictException("Dependency already exists", "CONFLICT");
  }

  const dep = await prisma.taskDependency.create({
    data: {
      taskId: input.taskId,
      dependsOnTaskId: input.dependsOnTaskId,
    },
    include: {
      task: { select: { id: true, title: true, status: true } },
      dependsOnTask: { select: { id: true, title: true, status: true } },
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "TASK_DEPENDENCY",
    entityId: dep.id,
    after: mapDependencyItem(dep, "blockedBy"),
  });

  return mapDependencyItem(dep, "blockedBy");
}

export async function removeTaskDependency(input: RemoveTaskDependencyInputType) {
  const dep = await prisma.taskDependency.findUnique({
    where: { id: input.id },
    include: {
      task: { select: { id: true, title: true, status: true } },
      dependsOnTask: { select: { id: true, title: true, status: true } },
    },
  });
  if (!dep) {
    throw new NotFoundException("TaskDependency", input.id);
  }

  const task = await loadTaskContext(dep.taskId);
  await assertProjectMember(input.userId, task.projectId);
  await assertCanEditTask(input.userId, await loadTaskWithProject(dep.taskId));

  await prisma.taskDependency.delete({ where: { id: input.id } });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "TASK_DEPENDENCY",
    entityId: input.id,
    before: mapDependencyItem(dep, "blockedBy"),
  });

  return true;
}
