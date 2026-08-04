import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateCommentSchema } from "interfaces/comment";

import { withValidation } from "utils/validation";

import { CommentType } from "..";
import { updateComment } from "../services";

const UpdateComment = {
  type: CommentType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    body: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { id, body }, context) =>
    withValidation(updateComment)({
      id,
      body,
      userId: context.userId,
      actorId: context.userId,
    }, UpdateCommentSchema),
};

export default UpdateComment;
