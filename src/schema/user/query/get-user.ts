import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetUserSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { UserType } from "..";
import { getUser } from "../services";

const GetUser = {
  type: new GraphQLNonNull(UserType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }) => withValidation(getUser)({ id }, GetUserSchema),
};

export default GetUser;
