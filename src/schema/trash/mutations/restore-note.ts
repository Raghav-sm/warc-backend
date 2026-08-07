import { GraphQLID, GraphQLNonNull } from "graphql";

import { RestoreNoteSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { NoteType } from "schema/note";

import { restoreNote } from "../services";

const RestoreNote = {
  type: NoteType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(restoreNote)({ id, userId: context.userId, actorId: context.userId }, RestoreNoteSchema),
};

export default RestoreNote;
