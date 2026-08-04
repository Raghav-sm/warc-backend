import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

export const AttachmentType = new GraphQLObjectType({
  name: "AttachmentType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: GraphQLID },
    commentId: { type: GraphQLID },
    fileUrl: { type: new GraphQLNonNull(GraphQLString) },
    fileName: { type: new GraphQLNonNull(GraphQLString) },
    fileType: { type: new GraphQLNonNull(GraphQLString) },
    size: { type: new GraphQLNonNull(GraphQLInt) },
    uploadedById: { type: new GraphQLNonNull(GraphQLID) },
    uploadedByFirstName: { type: GraphQLString },
    uploadedByLastName: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const AttachmentsType = new GraphQLObjectType({
  name: "AttachmentsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AttachmentType))) },
  }),
});

export const UploadSignatureType = new GraphQLObjectType({
  name: "UploadSignatureType",
  fields: () => ({
    signature: { type: new GraphQLNonNull(GraphQLString) },
    timestamp: { type: new GraphQLNonNull(GraphQLInt) },
    apiKey: { type: new GraphQLNonNull(GraphQLString) },
    cloudName: { type: new GraphQLNonNull(GraphQLString) },
    folder: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
