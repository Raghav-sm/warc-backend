import CreateFolder from "./create-folder";
import CreateNote from "./create-note";
import DeleteFolder from "./delete-folder";
import DeleteNote from "./delete-note";
import UpdateFolder from "./update-folder";
import UpdateNote from "./update-note";

const NoteMutationFields = {
  createFolder: CreateFolder,
  updateFolder: UpdateFolder,
  deleteFolder: DeleteFolder,
  createNote: CreateNote,
  updateNote: UpdateNote,
  deleteNote: DeleteNote,
};

export default NoteMutationFields;
