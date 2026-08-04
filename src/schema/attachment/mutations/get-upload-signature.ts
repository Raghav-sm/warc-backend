import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetUploadSignatureSchema } from "interfaces/attachment";

import { withValidation } from "utils/validation";

import { UploadSignatureType } from "..";
import { getUploadSignature } from "../services";

const GetUploadSignature = {
  type: UploadSignatureType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId }, context) =>
    withValidation(getUploadSignature)({ projectId, userId: context.userId }, GetUploadSignatureSchema),
};

export default GetUploadSignature;
