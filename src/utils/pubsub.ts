import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const CHANNELS = {
  projectTaskUpdated: (projectId: string) => `PROJECT_TASK_UPDATED:${projectId}`,
  taskCommentAdded: (taskId: string) => `TASK_COMMENT_ADDED:${taskId}`,
  userNotification: (userId: string) => `USER_NOTIFICATION:${userId}`,
} as const;

export type TaskUpdatedPayload = {
  id: string;
  projectId: string;
  status: string;
  progress: number;
  title: string;
};

export type CommentAddedPayload = {
  id: string;
  taskId: string;
  body: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: Date;
};

export type NotificationCreatedPayload = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

export async function publishTaskUpdated(projectId: string, payload: TaskUpdatedPayload): Promise<void> {
  await pubsub.publish(CHANNELS.projectTaskUpdated(projectId), { taskUpdated: payload });
}

export async function publishCommentAdded(taskId: string, payload: CommentAddedPayload): Promise<void> {
  await pubsub.publish(CHANNELS.taskCommentAdded(taskId), { commentAdded: payload });
}

export async function publishNotificationCreated(
  userId: string,
  payload: NotificationCreatedPayload,
): Promise<void> {
  await pubsub.publish(CHANNELS.userNotification(userId), { notificationCreated: payload });
}
