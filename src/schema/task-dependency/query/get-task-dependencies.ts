import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetTaskDependenciesSchema } from "interfaces/task-dependency";

import { withValidation } from "utils/validation";

import { TaskDependenciesType } from "..";
import { getTaskDependencies } from "../services";

const GetTaskDependencies = {
  type: new GraphQLNonNull(TaskDependenciesType),
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { taskId }, context) =>
    withValidation(getTaskDependencies)({ taskId, userId: context.userId }, GetTaskDependenciesSchema),
};

export default GetTaskDependencies;
