import { GraphQLID, GraphQLNonNull } from "graphql";

import { RestoreTaskSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { TaskType } from "schema/task";

import { restoreTask } from "../services";

const RestoreTask = {
  type: new GraphQLNonNull(TaskType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(restoreTask)({ id, userId: context.userId, actorId: context.userId }, RestoreTaskSchema),
};

export default RestoreTask;
