import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { RevokeSessionsSchema } from "interfaces/session";

import { withValidation } from "utils/validation";

import { revokeOtherSessions } from "../services";

const RevokeOtherSessions = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { refreshToken }, context) =>
    withValidation(revokeOtherSessions)(
      {
        userId: context.user.id,
        refreshToken,
      },
      RevokeSessionsSchema,
    ),
};

export default RevokeOtherSessions;
