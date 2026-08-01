import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetTaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import { TaskType } from "..";
import { getTask } from "../services";

const GetTask = {
  type: new GraphQLNonNull(TaskType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(getTask)({ id, userId: context.userId }, GetTaskSchema),
};

export default GetTask;
