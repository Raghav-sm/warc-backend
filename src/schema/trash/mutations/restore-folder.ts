import { GraphQLID, GraphQLNonNull } from "graphql";

import { RestoreFolderSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { FolderType } from "schema/note";

import { restoreFolder } from "../services";

const RestoreFolder = {
  type: FolderType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(restoreFolder)({ id, userId: context.userId, actorId: context.userId }, RestoreFolderSchema),
};

export default RestoreFolder;
