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
import { UserType } from "schema/user";

import TaskPriorityEnumType from "./enum/task-priority";
import TaskStatusEnumType from "./enum/task-status";
import TaskTypeEnumType from "./enum/task-type";

export const SubtaskType = new GraphQLObjectType({
  name: "SubtaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    weight: { type: new GraphQLNonNull(GraphQLInt) },
    isComplete: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const TaskAssigneeType = new GraphQLObjectType({
  name: "TaskAssigneeType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    assignedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    user: { type: UserType },
  }),
});

export const TaskType = new GraphQLObjectType({
  name: "TaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    type: { type: new GraphQLNonNull(TaskTypeEnumType) },
    weight: { type: new GraphQLNonNull(GraphQLInt) },
    progress: { type: new GraphQLNonNull(GraphQLInt) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    priority: { type: new GraphQLNonNull(TaskPriorityEnumType) },
    dueDate: { type: DateTimeScalar },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    createdById: { type: new GraphQLNonNull(GraphQLID) },
    createdByFirstName: { type: GraphQLString },
    createdByLastName: { type: GraphQLString },
    subtasks: { type: new GraphQLList(new GraphQLNonNull(SubtaskType)) },
    assignees: { type: new GraphQLList(new GraphQLNonNull(TaskAssigneeType)) },
    isBlocked: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const TasksType = new GraphQLObjectType({
  name: "TasksType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
