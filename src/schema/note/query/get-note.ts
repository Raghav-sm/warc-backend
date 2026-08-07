import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetNoteSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { NoteType } from "..";
import { getNote } from "../services";

const GetNote = {
  type: NoteType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(getNote)({ id, userId: context.userId }, GetNoteSchema),
};

export default GetNote;
