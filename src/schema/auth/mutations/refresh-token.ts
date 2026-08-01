import { GraphQLNonNull, GraphQLString } from "graphql";

import { RefreshTokenSchema } from "interfaces/auth";

import { withValidation } from "utils/validation";

import { AuthPayloadType } from "..";
import { refreshToken } from "../services";

const RefreshToken = {
  type: new GraphQLNonNull(AuthPayloadType),
  args: {
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { refreshToken: rawRefreshToken }, context) =>
    withValidation(refreshToken)(
      {
        refreshToken: rawRefreshToken,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
      RefreshTokenSchema,
    ),
};

export default RefreshToken;
