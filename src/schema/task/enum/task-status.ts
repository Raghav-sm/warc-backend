import { GraphQLEnumType } from "graphql";
import { TaskStatus } from "prisma-client/enums";

const TaskStatusEnumType = new GraphQLEnumType({
  name: "TaskStatusEnumType",
  values: {
    TODO: { value: TaskStatus.TODO },
    IN_PROGRESS: { value: TaskStatus.IN_PROGRESS },
    DONE: { value: TaskStatus.DONE },
  },
});

export default TaskStatusEnumType;
