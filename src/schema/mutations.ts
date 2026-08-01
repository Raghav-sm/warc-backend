import AuthMutationFields from "./auth/mutations";
import ProjectMutationFields from "./project/mutations";
import RoleMutationFields from "./role/mutations";
import SessionMutationFields from "./session/mutations";
import TaskMutationFields from "./task/mutations";
import UserMutationFields from "./user/mutations";

const mutationFields = {
  ...AuthMutationFields,
  ...UserMutationFields,
  ...SessionMutationFields,
  ...RoleMutationFields,
  ...ProjectMutationFields,
  ...TaskMutationFields,
};

export default mutationFields;
