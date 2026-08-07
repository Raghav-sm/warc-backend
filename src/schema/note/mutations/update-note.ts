import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateNoteSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { NoteType } from "..";
import { updateNote } from "../services";

const UpdateNote = {
  type: NoteType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    folderId: { type: GraphQLID },
  },
  resolve: (_root, { id, title, content, folderId }, context) =>
    withValidation(updateNote)(
      {
        id,
        title,
        content,
        folderId,
        userId: context.userId,
      },
      UpdateNoteSchema,
    ),
};

export default UpdateNote;
