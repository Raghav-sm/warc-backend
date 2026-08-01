import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const AuthPayloadType = new GraphQLObjectType({
  name: "AuthPayloadType",
  fields: () => ({
    accessToken: { type: new GraphQLNonNull(GraphQLString) },
    refreshToken: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
