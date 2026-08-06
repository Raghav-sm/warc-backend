import { GraphQLFieldConfig, GraphQLID, GraphQLNonNull, GraphQLObjectType } from "graphql";

import { getPrismaInstance } from "datasources/prisma";

import { assertProjectMember } from "utils/effective-permissions";
import { NotFoundException, UnauthenticatedException } from "utils/errors";
import { CHANNELS, pubsub } from "utils/pubsub";

import {
  CommentAddedPayloadType,
  NotificationCreatedPayloadType,
  TaskUpdatedPayloadType,
} from "./realtime";

const prisma = getPrismaInstance();

type SubscriptionContext = {
  userId?: string;
  isAuthenticated?: boolean;
};

async function loadTaskContext(taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: { id: true, projectId: true },
  });
  if (!task) {
    throw new NotFoundException("Task", taskId);
  }
  return task;
}

function requireUserId(context: SubscriptionContext): string {
  if (!context.isAuthenticated || !context.userId) {
    throw new UnauthenticatedException("User is not authenticated");
  }
  return context.userId;
}

const taskUpdatedField: GraphQLFieldConfig<unknown, SubscriptionContext> = {
  type: new GraphQLNonNull(TaskUpdatedPayloadType),
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
  },
  subscribe: async (_root, { projectId }, context) => {
    const userId = requireUserId(context);
    await assertProjectMember(userId, projectId as string);
    return pubsub.asyncIterableIterator(CHANNELS.projectTaskUpdated(projectId as string));
  },
  resolve: (payload) => (payload as { taskUpdated?: unknown }).taskUpdated,
};

const commentAddedField: GraphQLFieldConfig<unknown, SubscriptionContext> = {
  type: new GraphQLNonNull(CommentAddedPayloadType),
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
  },
  subscribe: async (_root, { taskId }, context) => {
    const userId = requireUserId(context);
    const task = await loadTaskContext(taskId as string);
    await assertProjectMember(userId, task.projectId);
    return pubsub.asyncIterableIterator(CHANNELS.taskCommentAdded(taskId as string));
  },
  resolve: (payload) => (payload as { commentAdded?: unknown }).commentAdded,
};

const notificationCreatedField: GraphQLFieldConfig<unknown, SubscriptionContext> = {
  type: new GraphQLNonNull(NotificationCreatedPayloadType),
  subscribe: async (_root, _args, context) => {
    const userId = requireUserId(context);
    return pubsub.asyncIterableIterator(CHANNELS.userNotification(userId));
  },
  resolve: (payload) => (payload as { notificationCreated?: unknown }).notificationCreated,
};

const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: () => ({
    taskUpdated: taskUpdatedField,
    commentAdded: commentAddedField,
    notificationCreated: notificationCreatedField,
  }),
});

export default SubscriptionType;
