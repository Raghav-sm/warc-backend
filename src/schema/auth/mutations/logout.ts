import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { LogoutSchema } from "interfaces/auth";

import { withValidation } from "utils/validation";

import { logout } from "../services";

const Logout = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { refreshToken }) =>
    withValidation(logout)(
      {
        refreshToken,
      },
      LogoutSchema,
    ),
};

export default Logout;
