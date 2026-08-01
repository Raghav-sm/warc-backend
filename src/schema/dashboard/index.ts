import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import ProjectStatusEnumType from "schema/project/enum/project-status";
import TaskPriorityEnumType from "schema/task/enum/task-priority";
import TaskStatusEnumType from "schema/task/enum/task-status";

export const DashboardKpiType = new GraphQLObjectType({
  name: "DashboardKpiType",
  fields: () => ({
    key: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: GraphQLString },
    value: { type: new GraphQLNonNull(GraphQLString) },
    tone: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const DashboardRecentUserType = new GraphQLObjectType({
  name: "DashboardRecentUserType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    roleName: { type: new GraphQLNonNull(GraphQLString) },
    isActive: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const DashboardProjectCardType = new GraphQLObjectType({
  name: "DashboardProjectCardType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(ProjectStatusEnumType) },
    progressPercent: { type: new GraphQLNonNull(GraphQLInt) },
    memberCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const DashboardMyTaskType = new GraphQLObjectType({
  name: "DashboardMyTaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    progress: { type: new GraphQLNonNull(GraphQLInt) },
    priority: { type: new GraphQLNonNull(TaskPriorityEnumType) },
    dueDate: { type: DateTimeScalar },
  }),
});

export const DashboardType = new GraphQLObjectType({
  name: "DashboardType",
  fields: () => ({
    kpis: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardKpiType))) },
    recentUsers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardRecentUserType))),
    },
    projectCards: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardProjectCardType))),
    },
    myTasks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardMyTaskType))),
    },
  }),
});
