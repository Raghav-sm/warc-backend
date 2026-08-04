import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteCommentSchema } from "interfaces/comment";

import { withValidation } from "utils/validation";

import { deleteComment } from "../services";

const DeleteComment = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteComment)({
      id,
      userId: context.userId,
      actorId: context.userId,
    }, DeleteCommentSchema),
};

export default DeleteComment;
