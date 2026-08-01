import { GraphQLEnumType } from "graphql";
import { TaskPriority } from "prisma-client/enums";

const TaskPriorityEnumType = new GraphQLEnumType({
  name: "TaskPriorityEnumType",
  values: {
    LOW: { value: TaskPriority.LOW },
    MEDIUM: { value: TaskPriority.MEDIUM },
    HIGH: { value: TaskPriority.HIGH },
    URGENT: { value: TaskPriority.URGENT },
  },
});

export default TaskPriorityEnumType;
