import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { LoginSchema } from "interfaces/auth";

import { withValidation } from "utils/validation";

import { AuthPayloadType } from "..";
import { login } from "../services";

const Login = {
  type: new GraphQLNonNull(AuthPayloadType),
  args: {
    emailOrEmployeeNumber: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    rememberMe: { type: GraphQLBoolean },
    callbackUrl: { type: GraphQLString },
  },
  resolve: (_root, { emailOrEmployeeNumber, password, rememberMe, callbackUrl }, context) =>
    withValidation(login)(
      {
        emailOrEmployeeNumber,
        password,
        rememberMe,
        callbackUrl,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
      LoginSchema,
    ),
};

export default Login;
