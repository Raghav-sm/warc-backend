import { TaskStatus } from "prisma-client/client";

import { ValidationException } from "utils/errors";

type SubtaskItem = { weight: number; isComplete: boolean };
type TaskItem = { weight: number; progress: number };

export function deriveTaskStatus(progress: number, manualStatus?: TaskStatus | null): TaskStatus {
  if (manualStatus != null) {
    return manualStatus;
  }
  if (progress <= 0) return TaskStatus.TODO;
  if (progress >= 100) return TaskStatus.DONE;
  return TaskStatus.IN_PROGRESS;
}

export function calcChecklistTaskProgress(subtasks: SubtaskItem[]): number {
  if (subtasks.length === 0) return 0;
  const total = subtasks.reduce((sum, subtask) => sum + subtask.weight * (subtask.isComplete ? 100 : 0), 0);
  return Math.round(total / 100);
}

export function calcProjectProgress(tasks: TaskItem[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + task.weight * task.progress, 0);
  return Math.round(total / 100);
}

export function remainingWeightPercent(weights: number[]): number {
  return 100 - weights.reduce((sum, weight) => sum + weight, 0);
}

export function validateWeightSum(weights: number[], label: string): void {
  const sum = weights.reduce((total, weight) => total + weight, 0);
  if (sum !== 100) {
    throw new ValidationException(`${label} weights must sum to 100 (current: ${sum})`);
  }
}

export function validateWeightItem(weight: number, label: string): void {
  if (weight < 0 || weight > 100) {
    throw new ValidationException(`${label} weight must be between 0 and 100`);
  }
}
