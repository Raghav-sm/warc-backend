import dotenv from "dotenv";
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { DateScalar, DateTimeScalar, TimeScalar } from "graphql-date-scalars";
import GraphQLJSON from "graphql-type-json";

import mutationFields from "./mutations";
import queryFields from "./query";
import SubscriptionType from "./subscriptions";

dotenv.config();

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: () => queryFields,
});

const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => mutationFields,
});

const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  subscription: SubscriptionType,
  types: [GraphQLJSON, DateScalar, TimeScalar, DateTimeScalar],
});

export default schema;
