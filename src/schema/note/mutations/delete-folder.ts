import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteFolderSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { deleteFolder } from "../services";

const DeleteFolder = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteFolder)({ id, userId: context.userId }, DeleteFolderSchema),
};

export default DeleteFolder;
