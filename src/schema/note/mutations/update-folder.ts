import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateFolderSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { FolderType } from "..";
import { updateFolder } from "../services";

const UpdateFolder = {
  type: FolderType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    parentId: { type: GraphQLID },
  },
  resolve: (_root, { id, name, parentId }, context) =>
    withValidation(updateFolder)(
      {
        id,
        name,
        parentId,
        userId: context.userId,
      },
      UpdateFolderSchema,
    ),
};

export default UpdateFolder;
