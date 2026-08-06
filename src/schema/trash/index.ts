import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";
import ProjectStatusEnumType from "schema/project/enum/project-status";
import TaskPriorityEnumType from "schema/task/enum/task-priority";
import TaskStatusEnumType from "schema/task/enum/task-status";

export const TrashedProjectType = new GraphQLObjectType({
  name: "TrashedProjectType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    status: { type: new GraphQLNonNull(ProjectStatusEnumType) },
    deletedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    ownerId: { type: new GraphQLNonNull(GraphQLID) },
    ownerName: { type: GraphQLString },
  }),
});

export const TrashedProjectsType = new GraphQLObjectType({
  name: "TrashedProjectsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TrashedProjectType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});

export const TrashedTaskType = new GraphQLObjectType({
  name: "TrashedTaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    priority: { type: new GraphQLNonNull(TaskPriorityEnumType) },
    deletedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const TrashedTasksType = new GraphQLObjectType({
  name: "TrashedTasksType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TrashedTaskType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
