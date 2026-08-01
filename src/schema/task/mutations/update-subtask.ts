import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateSubtaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { updateSubtask } from "../services";

const UpdateSubtask = {
  type: TaskType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    weight: { type: GraphQLInt },
    isComplete: { type: GraphQLBoolean },
  },
  resolve: (_root, args, context) =>
    withValidation(updateSubtask)({
      ...args,
      userId: context.userId,
      actorId: context.userId,
    }, UpdateSubtaskSchema),
};

export default UpdateSubtask;
