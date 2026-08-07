import { GraphQLInt, GraphQLNonNull } from "graphql";

import { GetTrashedFoldersSchema } from "interfaces/trash";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { TrashedFoldersType } from "..";
import { getTrashedFolders } from "../services";

const GetTrashedFolders = {
  type: new GraphQLNonNull(TrashedFoldersType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { page, limit }, context) =>
    withValidation(getTrashedFolders)({ page, limit, userId: context.userId }, GetTrashedFoldersSchema),
};

export default GetTrashedFolders;
