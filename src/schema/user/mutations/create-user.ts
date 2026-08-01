import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateUserSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { UserType } from "..";
import { createUser } from "../services";

const CreateUser = {
  type: UserType,
  args: {
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { firstName, lastName, email, password, roleId }, context) =>
    withValidation(createUser)(
      {
        firstName,
        lastName,
        email,
        password,
        roleId,
        actorId: context.userId,
      },
      CreateUserSchema,
    ),
};

export default CreateUser;
