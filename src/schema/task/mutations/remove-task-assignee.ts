import { GraphQLID, GraphQLNonNull } from "graphql";

import { RemoveTaskAssigneeSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { removeTaskAssignee } from "../services";

const RemoveTaskAssignee = {
  type: TaskType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    assigneeId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { taskId, assigneeId }, context) =>
    withValidation(removeTaskAssignee)({
      taskId,
      assigneeId,
      userId: context.userId,
      actorId: context.userId,
    }, RemoveTaskAssigneeSchema),
};

export default RemoveTaskAssignee;
