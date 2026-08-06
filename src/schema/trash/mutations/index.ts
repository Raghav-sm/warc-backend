import PermanentDeleteProject from "./permanent-delete-project";
import PermanentDeleteTask from "./permanent-delete-task";
import RestoreProject from "./restore-project";
import RestoreTask from "./restore-task";

const TrashMutationFields = {
  restoreProject: RestoreProject,
  restoreTask: RestoreTask,
  permanentDeleteProject: PermanentDeleteProject,
  permanentDeleteTask: PermanentDeleteTask,
};

export default TrashMutationFields;
