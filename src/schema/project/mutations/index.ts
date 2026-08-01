import AddProjectMember from "./add-project-member";
import CreateProject from "./create-project";
import DeleteProject from "./delete-project";
import RemoveProjectMember from "./remove-project-member";
import UpdateProject from "./update-project";
import UpdateProjectMemberRole from "./update-project-member-role";

const ProjectMutationFields = {
  createProject: CreateProject,
  updateProject: UpdateProject,
  deleteProject: DeleteProject,
  addProjectMember: AddProjectMember,
  updateProjectMemberRole: UpdateProjectMemberRole,
  removeProjectMember: RemoveProjectMember,
};

export default ProjectMutationFields;
