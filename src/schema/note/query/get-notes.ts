import { GraphQLBoolean, GraphQLID } from "graphql";

import { GetNotesSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { NotesType } from "..";
import { getNotes } from "../services";

const GetNotes = {
  type: NotesType,
  args: {
    folderId: { type: GraphQLID },
    all: { type: GraphQLBoolean },
  },
  resolve: (_root, { folderId, all }, context) =>
    withValidation(getNotes)(
      {
        userId: context.userId,
        folderId,
        all,
      },
      GetNotesSchema,
    ),
};

export default GetNotes;
