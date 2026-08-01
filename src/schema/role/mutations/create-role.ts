import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateRoleSchema } from "interfaces/roles";

import { withValidation } from "utils/validation";

import { RoleType } from "..";
import PermissionEnumType from "../enum/permissions";
import { createRole } from "../services";

const CreateRole = {
  type: RoleType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    code: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    permissionCodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PermissionEnumType))) },
  },
  resolve: (_root, { name, code, description, permissionCodes }, context) =>
    withValidation(createRole)(
      {
        name,
        code,
        description,
        permissionCodes,
        actorId: context.userId,
      },
      CreateRoleSchema,
    ),
};

export default CreateRole;
