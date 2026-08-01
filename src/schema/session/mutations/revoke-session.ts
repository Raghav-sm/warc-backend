import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { RevokeSessionsSchema } from "interfaces/session";

import { withValidation } from "utils/validation";

import { revokeSession } from "../services";

const RevokeSession = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { refreshToken }, context) =>
    withValidation(revokeSession)(
      {
        userId: context.user.id,
        refreshToken,
      },
      RevokeSessionsSchema,
    ),
};

export default RevokeSession;
