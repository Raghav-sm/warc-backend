import { GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

import { GetRolesSchema } from "interfaces/roles";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import PermissionEnumType from "../enum/permissions";
import { RolesType } from "..";
import { getRoles } from "../services";

const RoleFilterInputType = new GraphQLInputObjectType({
  name: "RoleFilterInputType",
  fields: () => ({
    text: { type: GraphQLString },
    permissionCodes: { type: new GraphQLList(new GraphQLNonNull(PermissionEnumType)) },
  }),
});

const GetRoles = {
  type: new GraphQLNonNull(RolesType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: RoleFilterInputType },
  },
  resolve: (_root, { page, limit, filters }) =>
    withValidation(getRoles)({ page, limit, filters }, GetRolesSchema),
};

export default GetRoles;
