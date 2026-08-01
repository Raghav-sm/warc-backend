import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateRoleSchema } from "interfaces/roles";

import { withValidation } from "utils/validation";

import { RoleType } from "..";
import PermissionEnumType from "../enum/permissions";
import { updateRole } from "../services";

const UpdateRole = {
  type: RoleType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    permissionCodes: { type: new GraphQLList(new GraphQLNonNull(PermissionEnumType)) },
  },
  resolve: (_root, { id, name, description, permissionCodes }, context) =>
    withValidation(updateRole)(
      {
        id,
        name,
        description,
        permissionCodes,
        actorId: context.userId,
      },
      UpdateRoleSchema,
    ),
};

export default UpdateRole;
