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

export const DashboardTaskStatusBreakdownType = new GraphQLObjectType({
  name: "DashboardTaskStatusBreakdownType",
  fields: () => ({
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const DashboardTasksDueTaskType = new GraphQLObjectType({
  name: "DashboardTasksDueTaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const DashboardTasksDueDayType = new GraphQLObjectType({
  name: "DashboardTasksDueDayType",
  fields: () => ({
    date: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    count: { type: new GraphQLNonNull(GraphQLInt) },
    tasks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardTasksDueTaskType))),
    },
  }),
});

export const DashboardActiveTimerType = new GraphQLObjectType({
  name: "DashboardActiveTimerType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    taskTitle: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    startedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const DashboardAttentionItemType = new GraphQLObjectType({
  name: "DashboardAttentionItemType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    kind: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: new GraphQLNonNull(GraphQLString) },
    taskId: { type: GraphQLID },
    projectId: { type: GraphQLID },
    notificationId: { type: GraphQLID },
  }),
});

export const DashboardActivityItemType = new GraphQLObjectType({
  name: "DashboardActivityItemType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    message: { type: new GraphQLNonNull(GraphQLString) },
    entityType: { type: new GraphQLNonNull(GraphQLString) },
    entityId: { type: new GraphQLNonNull(GraphQLID) },
    isRead: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    projectId: { type: GraphQLID },
    projectName: { type: GraphQLString },
  }),
});

export const DashboardProjectHealthType = new GraphQLObjectType({
  name: "DashboardProjectHealthType",
  fields: () => ({
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    openTaskCount: { type: new GraphQLNonNull(GraphQLInt) },
    overdueCount: { type: new GraphQLNonNull(GraphQLInt) },
    blockedCount: { type: new GraphQLNonNull(GraphQLInt) },
    healthStatus: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const DashboardTeamWorkloadType = new GraphQLObjectType({
  name: "DashboardTeamWorkloadType",
  fields: () => ({
    userId: { type: new GraphQLNonNull(GraphQLID) },
    userName: { type: new GraphQLNonNull(GraphQLString) },
    openTaskCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const DashboardProjectRiskTaskType = new GraphQLObjectType({
  name: "DashboardProjectRiskTaskType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
    priority: { type: new GraphQLNonNull(TaskPriorityEnumType) },
    dueDate: { type: DateTimeScalar },
    isOverdue: { type: new GraphQLNonNull(GraphQLBoolean) },
    isBlocked: { type: new GraphQLNonNull(GraphQLBoolean) },
    assigneeNames: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
    reason: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const DashboardType = new GraphQLObjectType({
  name: "DashboardType",
  fields: () => ({
    kpis: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardKpiType))) },
    projectKpis: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardKpiType))) },
    recentUsers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardRecentUserType))),
    },
    projectCards: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardProjectCardType))),
    },
    myTasks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardMyTaskType))),
    },
    taskStatusBreakdown: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardTaskStatusBreakdownType))),
    },
    tasksDueByDay: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardTasksDueDayType))),
    },
    activeTimer: { type: DashboardActiveTimerType },
    attentionItems: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardAttentionItemType))),
    },
    recentActivity: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardActivityItemType))),
    },
    projectHealth: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardProjectHealthType))),
    },
    teamWorkload: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardTeamWorkloadType))),
    },
    projectRiskTasks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardProjectRiskTaskType))),
    },
  }),
});
