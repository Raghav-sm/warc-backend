import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateFolderSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { FolderType } from "..";
import { createFolder } from "../services";

const CreateFolder = {
  type: FolderType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    parentId: { type: GraphQLID },
  },
  resolve: (_root, { name, parentId }, context) =>
    withValidation(createFolder)(
      {
        name,
        parentId,
        userId: context.userId,
      },
      CreateFolderSchema,
    ),
};

export default CreateFolder;
