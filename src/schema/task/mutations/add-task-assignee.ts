import { GraphQLID, GraphQLNonNull } from "graphql";

import { AddTaskAssigneeSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { addTaskAssignee } from "../services";

const AddTaskAssignee = {
  type: TaskType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    assigneeId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { taskId, assigneeId }, context) =>
    withValidation(addTaskAssignee)({
      taskId,
      assigneeId,
      userId: context.userId,
      actorId: context.userId,
    }, AddTaskAssigneeSchema),
};

export default AddTaskAssignee;
