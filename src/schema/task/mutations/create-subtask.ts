import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateSubtaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { createSubtask } from "../services";

const CreateSubtask = {
  type: TaskType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    weight: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: (_root, { taskId, title, weight }, context) =>
    withValidation(createSubtask)({
      taskId,
      title,
      weight,
      userId: context.userId,
      actorId: context.userId,
    }, CreateSubtaskSchema),
};

export default CreateSubtask;
