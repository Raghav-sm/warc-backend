import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { GlobalSearchSchema } from "interfaces/search";

import { withValidation } from "utils/validation";

import { SearchResultsType } from "..";
import { globalSearch } from "../services";

const GlobalSearch = {
  type: new GraphQLNonNull(SearchResultsType),
  args: {
    query: { type: new GraphQLNonNull(GraphQLString) },
    limit: { type: GraphQLInt, defaultValue: 5 },
  },
  resolve: (_root, { query, limit }, context) =>
    withValidation(globalSearch)({ query, limit, userId: context.userId }, GlobalSearchSchema),
};

export default GlobalSearch;
