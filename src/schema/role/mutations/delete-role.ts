import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteRoleSchema } from "interfaces/roles";

import { withValidation } from "utils/validation";

import { deleteRole } from "../services";

const DeleteRole = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteRole)({ id, actorId: context.userId }, DeleteRoleSchema),
};

export default DeleteRole;
