import PermanentDeleteProject from "./permanent-delete-project";
import PermanentDeleteTask from "./permanent-delete-task";
import RestoreFolder from "./restore-folder";
import RestoreNote from "./restore-note";
import RestoreProject from "./restore-project";
import RestoreTask from "./restore-task";

const TrashMutationFields = {
  restoreProject: RestoreProject,
  restoreTask: RestoreTask,
  restoreNote: RestoreNote,
  restoreFolder: RestoreFolder,
  permanentDeleteProject: PermanentDeleteProject,
  permanentDeleteTask: PermanentDeleteTask,
};

export default TrashMutationFields;
