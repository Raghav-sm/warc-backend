import { GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";

import { GetTrashedTasksSchema } from "interfaces/trash";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { TrashedTasksType } from "..";
import { getTrashedTasks } from "../services";

const GetTrashedTasks = {
  type: new GraphQLNonNull(TrashedTasksType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    projectId: { type: GraphQLID },
  },
  resolve: (_root, { page, limit, projectId }, context) =>
    withValidation(getTrashedTasks)(
      { page, limit, projectId, userId: context.userId },
      GetTrashedTasksSchema,
    ),
};

export default GetTrashedTasks;
