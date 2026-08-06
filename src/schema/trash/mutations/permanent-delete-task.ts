import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { PermanentDeleteTaskSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { permanentDeleteTask } from "../services";

const PermanentDeleteTask = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(permanentDeleteTask)(
      { id, userId: context.userId, actorId: context.userId },
      PermanentDeleteTaskSchema,
    ),
};

export default PermanentDeleteTask;
