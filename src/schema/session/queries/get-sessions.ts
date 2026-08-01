import { GraphQLInt, GraphQLNonNull } from "graphql";

import { GetSessionsSchema } from "interfaces/session";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { SessionsType } from "..";
import { getSessions } from "../services";

const GetSessions = {
  type: new GraphQLNonNull(SessionsType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { page, limit }, context) =>
    withValidation(getSessions)(
      {
        page,
        limit,
        userId: context.user.id,
      },
      GetSessionsSchema,
    ),
};

export default GetSessions;
