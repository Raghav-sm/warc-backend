import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteSubtaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { deleteSubtask } from "../services";

const DeleteSubtask = {
  type: TaskType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteSubtask)({ id, userId: context.userId, actorId: context.userId }, DeleteSubtaskSchema),
};

export default DeleteSubtask;
