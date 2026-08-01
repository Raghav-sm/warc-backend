import CreateRole from "./create-role";
import DeleteRole from "./delete-role";
import UpdateRole from "./update-role";

const RoleMutationFields = {
  createRole: CreateRole,
  updateRole: UpdateRole,
  deleteRole: DeleteRole,
};

export default RoleMutationFields;
