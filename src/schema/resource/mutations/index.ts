import CreateResource from "./create-resource";
import DeleteResource from "./delete-resource";
import UpdateResource from "./update-resource";

const ResourceMutationFields = {
  createResource: CreateResource,
  updateResource: UpdateResource,
  deleteResource: DeleteResource,
};

export default ResourceMutationFields;
