import { GraphQLBoolean, GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateUserSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { UserType } from "..";
import { updateUser } from "../services";

const UpdateUserById = {
  type: UserType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    roleId: { type: GraphQLID },
    isActive: { type: GraphQLBoolean },
  },
  resolve: (_root, { id, firstName, lastName, email, roleId, isActive }, context) =>
    withValidation(updateUser)(
      {
        id,
        firstName,
        lastName,
        email,
        roleId,
        isActive,
        actorId: context.userId,
      },
      UpdateUserSchema,
    ),
};

export default UpdateUserById;
