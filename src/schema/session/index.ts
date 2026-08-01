import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";
import { UserType } from "schema/user";
import { getUser } from "schema/user/services";

export const SessionType = new GraphQLObjectType({
  name: "SessionType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    expiresAt: { type: new GraphQLNonNull(DateTimeScalar) },
    userAgent: { type: GraphQLString },
    ipAddress: { type: GraphQLString },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    user: {
      type: new GraphQLNonNull(UserType),
      resolve: (session) => getUser({ id: session.userId }),
    },
    revoked: { type: new GraphQLNonNull(GraphQLBoolean) },
    revokedAt: { type: DateTimeScalar },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const SessionsType = new GraphQLObjectType({
  name: "SessionsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(SessionType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
