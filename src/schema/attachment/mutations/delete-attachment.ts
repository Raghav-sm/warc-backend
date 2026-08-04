import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteAttachmentSchema } from "interfaces/attachment";

import { withValidation } from "utils/validation";

import { deleteAttachment } from "../services";

const DeleteAttachment = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteAttachment)({
      id,
      userId: context.userId,
      actorId: context.userId,
    }, DeleteAttachmentSchema),
};

export default DeleteAttachment;
