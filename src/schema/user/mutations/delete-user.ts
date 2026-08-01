import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteUserSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { deleteUser } from "../services";

const DeleteUser = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteUser)({ id, actorId: context.userId }, DeleteUserSchema),
};

export default DeleteUser;
