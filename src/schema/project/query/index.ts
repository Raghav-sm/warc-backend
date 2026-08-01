import GetProject from "./get-project";
import GetProjectMembers from "./get-project-members";
import GetProjects from "./get-projects";

const ProjectQueryFields = {
  getProject: GetProject,
  getProjects: GetProjects,
  getProjectMembers: GetProjectMembers,
};

export default ProjectQueryFields;
