import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import ResourceTypeEnumType from "./enum/resource-type";
import ResourceVisibilityEnumType from "./enum/resource-visibility";

export const ResourceType = new GraphQLObjectType({
  name: "ResourceType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(ResourceTypeEnumType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    url: { type: GraphQLString },
    fileUrl: { type: GraphQLString },
    fileName: { type: GraphQLString },
    fileType: { type: GraphQLString },
    size: { type: GraphQLInt },
    visibility: { type: new GraphQLNonNull(ResourceVisibilityEnumType) },
    createdById: { type: new GraphQLNonNull(GraphQLID) },
    viewerIds: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const ResourcesType = new GraphQLObjectType({
  name: "ResourcesType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ResourceType))) },
  }),
});
