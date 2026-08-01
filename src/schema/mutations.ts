import AuthMutationFields from "./auth/mutations";
import RoleMutationFields from "./role/mutations";
import SessionMutationFields from "./session/mutations";
import UserMutationFields from "./user/mutations";

const mutationFields = {
  ...AuthMutationFields,
  ...UserMutationFields,
  ...SessionMutationFields,
  ...RoleMutationFields,
};

export default mutationFields;
