import { GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { GetAuditLogsSchema } from "interfaces/audit-logs";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { AuditLogsType } from "..";
import { getAuditLogs } from "../services";

const AuditLogFilterInputType = new GraphQLInputObjectType({
  name: "AuditLogFilterInputType",
  fields: () => ({
    action: { type: GraphQLString },
    entityType: { type: GraphQLString },
    entityId: { type: GraphQLID },
    actorId: { type: GraphQLID },
  }),
});

const GetAuditLogs = {
  type: new GraphQLNonNull(AuditLogsType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: AuditLogFilterInputType },
  },
  resolve: (_root, { page, limit, filters }) =>
    withValidation(getAuditLogs)({ page, limit, filters }, GetAuditLogsSchema),
};

export default GetAuditLogs;
