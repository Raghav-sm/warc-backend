import { GraphQLID } from "graphql";

import { GetAttachmentsSchema } from "interfaces/attachment";

import { withValidation } from "utils/validation";

import { AttachmentsType } from "..";
import { getAttachments } from "../services";

const GetAttachments = {
  type: AttachmentsType,
  args: {
    taskId: { type: GraphQLID },
    commentId: { type: GraphQLID },
  },
  resolve: (_root, { taskId, commentId }, context) =>
    withValidation(getAttachments)({ taskId, commentId, userId: context.userId }, GetAttachmentsSchema),
};

export default GetAttachments;
