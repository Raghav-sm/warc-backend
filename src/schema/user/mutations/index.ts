import AssignUserRole from "./assign-user-role";
import CreateUser from "./create-user";
import DeleteUser from "./delete-user";
import UpdateUser from "./update-user";
import UpdateUserById from "./update-user-by-id";

const UserMutationFields = {
  updateUser: UpdateUser,
  createUser: CreateUser,
  updateUserById: UpdateUserById,
  deleteUser: DeleteUser,
  assignUserRole: AssignUserRole,
};

export default UserMutationFields;
