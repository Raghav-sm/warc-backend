import { GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";

import { GetTimeLogsSchema } from "interfaces/time-log";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { TimeLogsType } from "..";
import { getTimeLogs } from "../services";

const GetTimeLogs = {
  type: new GraphQLNonNull(TimeLogsType),
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { taskId, page, limit }, context) =>
    withValidation(getTimeLogs)({ taskId, page, limit, userId: context.userId }, GetTimeLogsSchema),
};

export default GetTimeLogs;
