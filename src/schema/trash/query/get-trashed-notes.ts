import { GraphQLInt, GraphQLNonNull } from "graphql";

import { GetTrashedNotesSchema } from "interfaces/trash";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { TrashedNotesType } from "..";
import { getTrashedNotes } from "../services";

const GetTrashedNotes = {
  type: new GraphQLNonNull(TrashedNotesType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { page, limit }, context) =>
    withValidation(getTrashedNotes)({ page, limit, userId: context.userId }, GetTrashedNotesSchema),
};

export default GetTrashedNotes;
