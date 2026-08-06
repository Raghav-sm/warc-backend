import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import TaskStatusEnumType from "schema/task/enum/task-status";

export const TaskUpdatedPayloadType = new GraphQLObjectType({
  name: "TaskUpdatedPayloadType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    progress: { type: new GraphQLNonNull(GraphQLInt) },
    title: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const CommentAddedPayloadType = new GraphQLObjectType({
  name: "CommentAddedPayloadType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    body: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(GraphQLID) },
    authorFirstName: { type: new GraphQLNonNull(GraphQLString) },
    authorLastName: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const NotificationCreatedPayloadType = new GraphQLObjectType({
  name: "NotificationCreatedPayloadType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    entityType: { type: new GraphQLNonNull(GraphQLString) },
    entityId: { type: new GraphQLNonNull(GraphQLID) },
    message: { type: new GraphQLNonNull(GraphQLString) },
    isRead: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});
