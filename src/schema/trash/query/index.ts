import GetTrashedFolders from "./get-trashed-folders";
import GetTrashedNotes from "./get-trashed-notes";
import GetTrashedProjects from "./get-trashed-projects";
import GetTrashedTasks from "./get-trashed-tasks";

const TrashQueryFields = {
  getTrashedProjects: GetTrashedProjects,
  getTrashedTasks: GetTrashedTasks,
  getTrashedNotes: GetTrashedNotes,
  getTrashedFolders: GetTrashedFolders,
};

export default TrashQueryFields;
