import { getPrismaInstance } from "datasources/prisma";
import type {
  AddTaskAssigneeInputType,
  CreateSubtaskInputType,
  CreateTaskInputType,
  DeleteSubtaskInputType,
  DeleteTaskInputType,
  GetTaskInputType,
  GetTasksInputType,
  RemoveTaskAssigneeInputType,
  TaskFilterInputType,
  UpdateSubtaskInputType,
  UpdateTaskInputType,
} from "interfaces/task";
import { Permission, TaskType, type Prisma } from "prisma-client/client";

import { writeAuditLog } from "schema/audit-log/services";

import { getEffectivePermissions, requirePermission } from "utils/effective-permissions";
import { ConflictException, ForbiddenException, NotFoundException, ValidationException } from "utils/errors";
import {
  calcChecklistTaskProgress,
  deriveTaskStatus,
  validateWeightItem,
  validateWeightSum,
} from "utils/progress";
import { hasProvided } from "utils/validation";

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

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function mapUserForGraphql(user: Prisma.UserGetPayload<{ include: { role: true } }>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleCode: user.role.code,
    roleName: user.role.name,
    isActive: user.isActive,
    permissions: user.role.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapSubtask(subtask: Prisma.SubtaskGetPayload<object>) {
  return {
    id: subtask.id,
    taskId: subtask.taskId,
    title: subtask.title,
    weight: subtask.weight,
    isComplete: subtask.isComplete,
    createdAt: subtask.createdAt,
    updatedAt: subtask.updatedAt,
  };
}

function mapAssignee(assignee: TaskWithRelations["assignees"][number]) {
  return {
    id: assignee.id,
    taskId: assignee.taskId,
    userId: assignee.userId,
    assignedAt: assignee.assignedAt,
    user: mapUserForGraphql(assignee.user),
  };
}

function mapTask(task: TaskWithRelations) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    weight: task.weight,
    progress: task.progress,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    projectId: task.projectId,
    createdById: task.createdById,
    createdByFirstName: task.createdBy.firstName,
    createdByLastName: task.createdBy.lastName,
    subtasks: task.subtasks.map(mapSubtask),
    assignees: task.assignees.map(mapAssignee),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function assertProjectMember(userId: string, projectId: string): Promise<void> {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership) {
    throw new ForbiddenException("Not a project member");
  }
}

async function loadTaskWithProject(taskId: string): Promise<TaskWithRelations> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: taskInclude,
  });
  if (!task) {
    throw new NotFoundException("Task", taskId);
  }
  return task;
}

async function validateProjectTaskWeights(
  projectId: string,
  options?: { replaceTaskId?: string; weight?: number; additionalWeight?: number },
): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { projectId, deletedAt: null },
    select: { id: true, weight: true },
  });

  const weights = tasks.map((task) => {
    if (options?.replaceTaskId === task.id && options.weight != null) {
      return options.weight;
    }
    return task.weight;
  });

  if (options?.additionalWeight != null) {
    weights.push(options.additionalWeight);
  }

  validateWeightSum(weights, "Project task");
}

async function validateTaskSubtaskWeights(taskId: string, options?: { replaceSubtaskId?: string; weight?: number; additionalWeight?: number }): Promise<void> {
  const subtasks = await prisma.subtask.findMany({
    where: { taskId },
    select: { id: true, weight: true },
  });

  const weights = subtasks.map((subtask) => {
    if (options?.replaceSubtaskId === subtask.id && options.weight != null) {
      return options.weight;
    }
    return subtask.weight;
  });

  if (options?.additionalWeight != null) {
    weights.push(options.additionalWeight);
  }

  validateWeightSum(weights, "Subtask");
}

async function assertCanEditTask(userId: string, task: TaskWithRelations): Promise<void> {
  const isCreator = task.createdById === userId;
  const isAssignee = task.assignees.some((assignee) => assignee.userId === userId);

  if (isCreator || isAssignee) {
    await requirePermission(userId, Permission.TASK_EDIT_OWN, task.projectId);
    return;
  }

  await requirePermission(userId, Permission.TASK_EDIT_ANY, task.projectId);
}

function buildTaskWhere(userId: string, filters: TaskFilterInputType = {}): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    deletedAt: null,
    project: {
      members: { some: { userId } },
    },
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

function checklistProgressFromTask(task: TaskWithRelations): number {
  return calcChecklistTaskProgress(task.subtasks.map((subtask) => ({ weight: subtask.weight, isComplete: subtask.isComplete })));
}

export async function getTasks(input: GetTasksInputType) {
  if (hasProvided(input.filters?.projectId)) {
    await assertProjectMember(input.userId, input.filters.projectId);
  }

  const [nodes, pageInfo] = await prisma.task
    .paginate({
      where: buildTaskWhere(input.userId, input.filters),
      include: taskInclude,
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return {
    nodes: nodes.map(mapTask),
    pageInfo,
  };
}

export async function getTask(input: GetTaskInputType) {
  const task = await loadTaskWithProject(input.id);
  await assertProjectMember(input.userId, task.projectId);
  return mapTask(task);
}

export async function createTask(input: CreateTaskInputType) {
  await requirePermission(input.userId, Permission.TASK_CREATE, input.projectId);
  validateWeightItem(input.weight, "Task");

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, deletedAt: null },
  });
  if (!project) {
    throw new NotFoundException("Project", input.projectId);
  }

  await validateProjectTaskWeights(input.projectId, { additionalWeight: input.weight });

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? TaskType.SIMPLE,
      weight: input.weight,
      priority: input.priority ?? undefined,
      dueDate: input.dueDate ?? null,
      createdById: input.actorId,
    },
    include: taskInclude,
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "TASK",
    entityId: task.id,
    after: mapTask(task),
  });

  return mapTask(task);
}

async function assertCanChangeTaskStatus(userId: string, task: TaskWithRelations): Promise<void> {
  const permissions = await getEffectivePermissions(userId, task.projectId);
  if (permissions.includes(Permission.TASK_CHANGE_STATUS)) {
    return;
  }
  await assertCanEditTask(userId, task);
}

export async function updateTask(input: UpdateTaskInputType) {
  const before = await loadTaskWithProject(input.id);

  const statusChanging = hasProvided(input.status) && input.status !== before.status;
  if (statusChanging) {
    await assertCanChangeTaskStatus(input.userId, before);
  } else {
    await assertCanEditTask(input.userId, before);
  }

  if (hasProvided(input.weight)) {
    validateWeightItem(input.weight, "Task");
    await validateProjectTaskWeights(before.projectId, {
      replaceTaskId: before.id,
      weight: input.weight,
    });
  }

  const nextType = input.type ?? before.type;
  let nextProgress = input.progress ?? before.progress;

  if (nextType === TaskType.CHECKLIST) {
    nextProgress = checklistProgressFromTask(before);
    if (hasProvided(input.progress)) {
      nextProgress = input.progress;
    }
  } else if (hasProvided(input.progress)) {
    nextProgress = input.progress;
  }

  const nextStatus = deriveTaskStatus(
    nextProgress,
    hasProvided(input.status) ? input.status : undefined,
  );

  const task = await prisma.task.update({
    where: { id: input.id },
    data: {
      title: input.title ?? before.title,
      description: hasProvided(input.description) ? input.description : before.description,
      type: nextType,
      weight: input.weight ?? before.weight,
      progress: nextProgress,
      status: nextStatus,
      priority: input.priority ?? before.priority,
      dueDate: hasProvided(input.dueDate) ? input.dueDate : before.dueDate,
    },
    include: taskInclude,
  });

  const mappedAfter = mapTask(task);

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "TASK",
    entityId: task.id,
    before: mapTask(before),
    after: mappedAfter,
  });

  return mappedAfter;
}

export async function deleteTask(input: DeleteTaskInputType) {
  const before = await loadTaskWithProject(input.id);
  await requirePermission(input.userId, Permission.TASK_DELETE, before.projectId);

  await prisma.task.update({
    where: { id: input.id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "TASK",
    entityId: input.id,
    before: mapTask(before),
  });

  return true;
}

export async function addTaskAssignee(input: AddTaskAssigneeInputType) {
  const task = await loadTaskWithProject(input.taskId);
  await requirePermission(input.userId, Permission.TASK_ASSIGN, task.projectId);

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: input.assigneeId, projectId: task.projectId } },
  });
  if (!member) {
    throw new ValidationException("Assignee must be a project member", "BAD_USER_INPUT", { field: "assigneeId" });
  }

  const existing = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId: input.taskId, userId: input.assigneeId } },
  });
  if (existing) {
    throw new ConflictException("User is already assigned to this task", "CONFLICT", { field: "assigneeId" });
  }

  await prisma.taskAssignee.create({
    data: {
      taskId: input.taskId,
      userId: input.assigneeId,
    },
  });

  const after = await loadTaskWithProject(input.taskId);

  await writeAuditLog({
    actorId: input.actorId,
    action: "ASSIGN",
    entityType: "TASK",
    entityId: task.id,
    after: mapTask(after),
    metadata: { assigneeId: input.assigneeId },
  });

  return mapTask(after);
}

export async function removeTaskAssignee(input: RemoveTaskAssigneeInputType) {
  const task = await loadTaskWithProject(input.taskId);
  await requirePermission(input.userId, Permission.TASK_ASSIGN, task.projectId);

  const assignee = await prisma.taskAssignee.findUnique({
    where: { taskId_userId: { taskId: input.taskId, userId: input.assigneeId } },
  });
  if (!assignee) {
    throw new NotFoundException("Task assignee", input.assigneeId);
  }

  await prisma.taskAssignee.delete({
    where: { taskId_userId: { taskId: input.taskId, userId: input.assigneeId } },
  });

  const after = await loadTaskWithProject(input.taskId);

  await writeAuditLog({
    actorId: input.actorId,
    action: "UNASSIGN",
    entityType: "TASK",
    entityId: task.id,
    before: mapTask(task),
    after: mapTask(after),
    metadata: { assigneeId: input.assigneeId },
  });

  return mapTask(after);
}

export async function createSubtask(input: CreateSubtaskInputType) {
  const task = await loadTaskWithProject(input.taskId);
  await assertCanEditTask(input.userId, task);

  if (task.type !== TaskType.CHECKLIST) {
    throw new ValidationException("Subtasks are only allowed on checklist tasks", "BAD_USER_INPUT", { field: "taskId" });
  }

  validateWeightItem(input.weight, "Subtask");
  await validateTaskSubtaskWeights(input.taskId, { additionalWeight: input.weight });

  const subtask = await prisma.subtask.create({
    data: {
      taskId: input.taskId,
      title: input.title,
      weight: input.weight,
    },
  });

  const updatedTask = await recalcChecklistTaskProgress(input.taskId);

  await writeAuditLog({
    actorId: input.actorId,
    action: "CREATE",
    entityType: "SUBTASK",
    entityId: subtask.id,
    after: mapSubtask(subtask),
    metadata: { taskId: input.taskId },
  });

  return mapTask(updatedTask);
}

export async function updateSubtask(input: UpdateSubtaskInputType) {
  const subtask = await prisma.subtask.findUnique({ where: { id: input.id } });
  if (!subtask) {
    throw new NotFoundException("Subtask", input.id);
  }

  const task = await loadTaskWithProject(subtask.taskId);
  await assertCanEditTask(input.userId, task);

  if (hasProvided(input.weight)) {
    validateWeightItem(input.weight, "Subtask");
    await validateTaskSubtaskWeights(task.id, {
      replaceSubtaskId: subtask.id,
      weight: input.weight,
    });
  }

  const updatedSubtask = await prisma.subtask.update({
    where: { id: input.id },
    data: {
      title: input.title ?? subtask.title,
      weight: input.weight ?? subtask.weight,
      isComplete: input.isComplete ?? subtask.isComplete,
    },
  });

  const updatedTask = await recalcChecklistTaskProgress(task.id);

  await writeAuditLog({
    actorId: input.actorId,
    action: "UPDATE",
    entityType: "SUBTASK",
    entityId: updatedSubtask.id,
    before: mapSubtask(subtask),
    after: mapSubtask(updatedSubtask),
    metadata: { taskId: task.id },
  });

  return mapTask(updatedTask);
}

export async function deleteSubtask(input: DeleteSubtaskInputType) {
  const subtask = await prisma.subtask.findUnique({ where: { id: input.id } });
  if (!subtask) {
    throw new NotFoundException("Subtask", input.id);
  }

  const task = await loadTaskWithProject(subtask.taskId);
  await assertCanEditTask(input.userId, task);

  await prisma.subtask.delete({ where: { id: input.id } });

  const remainingSubtasks = await prisma.subtask.count({ where: { taskId: task.id } });
  if (remainingSubtasks > 0) {
    await validateTaskSubtaskWeights(task.id);
  }

  const updatedTask = await recalcChecklistTaskProgress(task.id);

  await writeAuditLog({
    actorId: input.actorId,
    action: "DELETE",
    entityType: "SUBTASK",
    entityId: input.id,
    before: mapSubtask(subtask),
    metadata: { taskId: task.id },
  });

  return mapTask(updatedTask);
}

async function recalcChecklistTaskProgress(taskId: string): Promise<TaskWithRelations> {
  const task = await loadTaskWithProject(taskId);
  const progress = checklistProgressFromTask(task);
  const status = deriveTaskStatus(progress, null);

  return prisma.task.update({
    where: { id: taskId },
    data: { progress, status },
    include: taskInclude,
  });
}
