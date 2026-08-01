import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";

import { SignUpSchema } from "interfaces/auth";

import { withValidation } from "utils/validation";

import { AuthPayloadType } from "..";
import { signUp } from "../services";

const SignUp = {
  type: new GraphQLNonNull(AuthPayloadType),
  args: {
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    rememberMe: { type: GraphQLBoolean },
    callbackUrl: { type: GraphQLString },
  },
  resolve: (_root, { firstName, lastName, email, password, rememberMe, callbackUrl }, context) =>
    withValidation(signUp)(
      {
        firstName,
        lastName,
        email,
        password,
        rememberMe,
        callbackUrl,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
      SignUpSchema,
    ),
};

export default SignUp;
