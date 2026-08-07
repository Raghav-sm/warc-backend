import { GetFoldersSchema } from "interfaces/note";

import { withValidation } from "utils/validation";

import { FoldersType } from "..";
import { getFolders } from "../services";

const GetFolders = {
  type: FoldersType,
  resolve: (_root, _args, context) =>
    withValidation(getFolders)({ userId: context.userId }, GetFoldersSchema),
};

export default GetFolders;
