import { GraphQLID, GraphQLNonNull } from "graphql";

import { AssignUserRoleSchema } from "interfaces/user";

import { withValidation } from "utils/validation";

import { UserType } from "..";
import { assignUserRole } from "../services";

const AssignUserRole = {
  type: UserType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id, roleId }, context) =>
    withValidation(assignUserRole)({ id, roleId, actorId: context.userId }, AssignUserRoleSchema),
};

export default AssignUserRole;
