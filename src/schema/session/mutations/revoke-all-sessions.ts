import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { RevokeSessionsSchema } from "interfaces/session";

import { withValidation } from "utils/validation";

import { revokeAllSessions } from "../services";

const RevokeAllSessions = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { refreshToken }, context) =>
    withValidation(revokeAllSessions)(
      {
        userId: context.user.id,
        refreshToken,
      },
      RevokeSessionsSchema,
    ),
};

export default RevokeAllSessions;
