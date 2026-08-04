import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import TaskStatusEnumType from "schema/task/enum/task-status";

export const TaskDependencyItemType = new GraphQLObjectType({
  name: "TaskDependencyItemType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    dependsOnTaskId: { type: new GraphQLNonNull(GraphQLID) },
    taskTitle: { type: GraphQLString },
    dependsOnTaskTitle: { type: GraphQLString },
    dependsOnTaskStatus: { type: TaskStatusEnumType },
  }),
});

export const TaskDependenciesType = new GraphQLObjectType({
  name: "TaskDependenciesType",
  fields: () => ({
    blocks: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskDependencyItemType))) },
    blockedBy: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskDependencyItemType))) },
    isBlocked: { type: new GraphQLNonNull(GraphQLBoolean) },
  }),
});
