import AuthMutationFields from "./auth/mutations";
import AttachmentMutationFields from "./attachment/mutations";
import ResourceMutationFields from "./resource/mutations";
import CommentMutationFields from "./comment/mutations";
import NotificationMutationFields from "./notification/mutations";
import ProjectMutationFields from "./project/mutations";
import RoleMutationFields from "./role/mutations";
import SessionMutationFields from "./session/mutations";
import TaskDependencyMutationFields from "./task-dependency/mutations";
import TaskMutationFields from "./task/mutations";
import TimeLogMutationFields from "./time-log/mutations";
import TrashMutationFields from "./trash/mutations";
import UserMutationFields from "./user/mutations";

const mutationFields = {
  ...AuthMutationFields,
  ...UserMutationFields,
  ...SessionMutationFields,
  ...RoleMutationFields,
  ...ProjectMutationFields,
  ...TaskMutationFields,
  ...CommentMutationFields,
  ...AttachmentMutationFields,
  ...ResourceMutationFields,
  ...TaskDependencyMutationFields,
  ...TimeLogMutationFields,
  ...NotificationMutationFields,
  ...TrashMutationFields,
};

export default mutationFields;
