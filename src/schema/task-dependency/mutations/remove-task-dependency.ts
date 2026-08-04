import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { RemoveTaskDependencySchema } from "interfaces/task-dependency";

import { withValidation } from "utils/validation";

import { removeTaskDependency } from "../services";

const RemoveTaskDependency = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(removeTaskDependency)({
      id,
      userId: context.userId,
      actorId: context.userId,
    }, RemoveTaskDependencySchema),
};

export default RemoveTaskDependency;
