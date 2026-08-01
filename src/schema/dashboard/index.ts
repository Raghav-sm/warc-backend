import { GraphQLBoolean, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

export const DashboardKpiType = new GraphQLObjectType({
  name: "DashboardKpiType",
  fields: () => ({
    key: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: GraphQLString },
    value: { type: new GraphQLNonNull(GraphQLString) },
    tone: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const DashboardRecentUserType = new GraphQLObjectType({
  name: "DashboardRecentUserType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    roleName: { type: new GraphQLNonNull(GraphQLString) },
    isActive: { type: new GraphQLNonNull(GraphQLBoolean) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const DashboardType = new GraphQLObjectType({
  name: "DashboardType",
  fields: () => ({
    kpis: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardKpiType))) },
    recentUsers: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DashboardRecentUserType))),
    },
  }),
});
