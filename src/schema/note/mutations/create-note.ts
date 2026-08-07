import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateNoteSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { NoteType } from "..";
import { createNote } from "../services";

const CreateNote = {
  type: NoteType,
  args: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: GraphQLString },
    folderId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { title, content, folderId }, context) =>
    withValidation(createNote)(
      {
        title,
        content,
        folderId,
        userId: context.userId,
      },
      CreateNoteSchema,
    ),
};

export default CreateNote;
