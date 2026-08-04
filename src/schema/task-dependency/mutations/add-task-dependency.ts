import { GraphQLID, GraphQLNonNull } from "graphql";

import { AddTaskDependencySchema } from "interfaces/task-dependency";

import { withValidation } from "utils/validation";

import { TaskDependencyItemType } from "..";
import { addTaskDependency } from "../services";

const AddTaskDependency = {
  type: TaskDependencyItemType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    dependsOnTaskId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { taskId, dependsOnTaskId }, context) =>
    withValidation(addTaskDependency)({
      taskId,
      dependsOnTaskId,
      userId: context.userId,
      actorId: context.userId,
    }, AddTaskDependencySchema),
};

export default AddTaskDependency;
