import { GraphQLNonNull } from "graphql";

import { UserType } from "schema/user";

const Me = {
  type: new GraphQLNonNull(UserType),
  resolve: (_root, _args, context) => context?.user,
};

export default Me;
