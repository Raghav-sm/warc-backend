import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateAttachmentSchema } from "interfaces/attachment";

import { withValidation } from "utils/validation";

import { AttachmentType } from "..";
import { createAttachment } from "../services";

const CreateAttachment = {
  type: AttachmentType,
  args: {
    taskId: { type: GraphQLID },
    commentId: { type: GraphQLID },
    fileUrl: { type: new GraphQLNonNull(GraphQLString) },
    fileName: { type: new GraphQLNonNull(GraphQLString) },
    fileType: { type: new GraphQLNonNull(GraphQLString) },
    size: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: (_root, { taskId, commentId, fileUrl, fileName, fileType, size }, context) =>
    withValidation(createAttachment)({
      taskId,
      commentId,
      fileUrl,
      fileName,
      fileType,
      size,
      userId: context.userId,
      actorId: context.userId,
    }, CreateAttachmentSchema),
};

export default CreateAttachment;
