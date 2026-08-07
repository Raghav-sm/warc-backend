import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

export const FolderType = new GraphQLObjectType({
  name: "FolderType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    parentId: { type: GraphQLID },
    noteCount: { type: new GraphQLNonNull(GraphQLInt) },
    children: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FolderType))) },
  }),
});

export const FoldersType = new GraphQLObjectType({
  name: "FoldersType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FolderType))) },
  }),
});

export const NoteType = new GraphQLObjectType({
  name: "NoteType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    folderId: { type: GraphQLID },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const NotesType = new GraphQLObjectType({
  name: "NotesType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NoteType))) },
  }),
});
