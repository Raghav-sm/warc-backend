import { GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";

import { GetCommentsSchema } from "interfaces/comment";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { CommentsType } from "..";
import { getComments } from "../services";

const GetComments = {
  type: new GraphQLNonNull(CommentsType),
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { taskId, page, limit }, context) =>
    withValidation(getComments)({ taskId, page, limit, userId: context.userId }, GetCommentsSchema),
};

export default GetComments;
