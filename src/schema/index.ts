import dotenv from "dotenv";
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { DateScalar, DateTimeScalar, TimeScalar } from "graphql-date-scalars";
import GraphQLJSON from "graphql-type-json";

import mutationFields from "./mutations";
import queryFields from "./query";

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
  types: [GraphQLJSON, DateScalar, TimeScalar, DateTimeScalar],
});

export default schema;
