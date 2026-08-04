import CreateComment from "./create-comment";
import DeleteComment from "./delete-comment";
import UpdateComment from "./update-comment";

const CommentMutationFields = {
  createComment: CreateComment,
  updateComment: UpdateComment,
  deleteComment: DeleteComment,
};

export default CommentMutationFields;
