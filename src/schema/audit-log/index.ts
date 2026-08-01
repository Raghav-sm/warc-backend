import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";
import GraphQLJSON from "graphql-type-json";

import { UserType } from "schema/user";
import { getUser } from "schema/user/services";
import PaginationType from "schema/pagination/pagination";

export const AuditLogType = new GraphQLObjectType({
  name: "AuditLogType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    action: { type: new GraphQLNonNull(GraphQLString) },
    entityType: { type: new GraphQLNonNull(GraphQLString) },
    entityId: { type: new GraphQLNonNull(GraphQLString) },
    before: { type: GraphQLJSON },
    after: { type: GraphQLJSON },
    metadata: { type: GraphQLJSON },
    actorId: { type: GraphQLID },
    actor: {
      type: UserType,
      resolve: (al) => (al.actorId ? getUser({ id: al.actorId }) : null),
    },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const AuditLogsType = new GraphQLObjectType({
  name: "AuditLogsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AuditLogType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
