import AddTaskAssignee from "./add-task-assignee";
import CreateSubtask from "./create-subtask";
import CreateTask from "./create-task";
import DeleteSubtask from "./delete-subtask";
import DeleteTask from "./delete-task";
import RemoveTaskAssignee from "./remove-task-assignee";
import UpdateSubtask from "./update-subtask";
import UpdateTask from "./update-task";

const TaskMutationFields = {
  createTask: CreateTask,
  updateTask: UpdateTask,
  deleteTask: DeleteTask,
  addTaskAssignee: AddTaskAssignee,
  removeTaskAssignee: RemoveTaskAssignee,
  createSubtask: CreateSubtask,
  updateSubtask: UpdateSubtask,
  deleteSubtask: DeleteSubtask,
};

export default TaskMutationFields;
