import { GraphQLBoolean, GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateUserSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { UserType } from "..";
import { updateUser } from "../services";

const UpdateUser = {
  type: UserType,
  args: {
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
  },
  resolve: (_root, { firstName, lastName, email }, context) =>
    withValidation(updateUser)(
      {
        id: context.user.id,
        firstName,
        lastName,
        email,
        actorId: context.userId,
      },
      UpdateUserSchema,
    ),
};

export default UpdateUser;
