import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";
import { SessionsType } from "schema/session";
import { getSessions } from "schema/session/services";

import { PAGINATION } from "utils/constants";

export const UserType = new GraphQLObjectType({
  name: "UserType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    fullName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (user) => [user.firstName, user.lastName].filter(Boolean).join(" "),
    },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
    roleCode: { type: GraphQLString },
    roleName: { type: GraphQLString },
    isActive: { type: GraphQLBoolean },
    permissions: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    sessions: {
      type: new GraphQLNonNull(SessionsType),
      args: {
        page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
        limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
      },
      resolve: (user, { page, limit }) => getSessions({ page, limit, userId: user.id }),
    },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const UsersType = new GraphQLObjectType({
  name: "UsersType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
