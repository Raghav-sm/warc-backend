import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateCommentSchema } from "interfaces/comment";

import { withValidation } from "utils/validation";

import { CommentType } from "..";
import { createComment } from "../services";

const CreateComment = {
  type: CommentType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    body: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: (_root, { taskId, body }, context) =>
    withValidation(createComment)({
      taskId,
      body,
      userId: context.userId,
      actorId: context.userId,
    }, CreateCommentSchema),
};

export default CreateComment;
