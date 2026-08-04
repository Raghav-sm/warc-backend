import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";
import { TaskType } from "schema/task";

export const NotificationType = new GraphQLObjectType({
  name: "NotificationType",
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

export const NotificationsType = new GraphQLObjectType({
  name: "NotificationsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NotificationType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
    unreadCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const MyTasksType = new GraphQLObjectType({
  name: "MyTasksType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
