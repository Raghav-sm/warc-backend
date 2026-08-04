import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";

export const CommentType = new GraphQLObjectType({
  name: "CommentType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    body: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(GraphQLID) },
    authorFirstName: { type: GraphQLString },
    authorLastName: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const CommentsType = new GraphQLObjectType({
  name: "CommentsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
