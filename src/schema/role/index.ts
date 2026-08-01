import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";

import { PAGINATION } from "utils/constants";

import PermissionEnumType from "./enum/permissions";

export const RoleType = new GraphQLObjectType({
  name: "RoleType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    code: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    permissions: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PermissionEnumType))) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const RolesType = new GraphQLObjectType({
  name: "RolesType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RoleType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
