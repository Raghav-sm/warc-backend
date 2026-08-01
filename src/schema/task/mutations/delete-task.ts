import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteTaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { deleteTask } from "../services";

const DeleteTask = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteTask)({ id, userId: context.userId, actorId: context.userId }, DeleteTaskSchema),
};

export default DeleteTask;
