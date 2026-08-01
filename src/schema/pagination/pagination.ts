import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLObjectType } from "graphql";

const PaginationType = new GraphQLObjectType({
  name: "PaginationType",
  fields: () => ({
    isFirstPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    isLastPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    currentPage: { type: new GraphQLNonNull(GraphQLInt) },
    previousPage: { type: GraphQLInt },
    nextPage: { type: GraphQLInt },
    pageCount: { type: new GraphQLNonNull(GraphQLInt) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export default PaginationType;
