import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteNoteSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { deleteNote } from "../services";

const DeleteNote = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteNote)({ id, userId: context.userId }, DeleteNoteSchema),
};

export default DeleteNote;
