import { GraphQLEnumType } from "graphql";
import { TaskType } from "prisma-client/enums";

const TaskTypeEnumType = new GraphQLEnumType({
  name: "TaskTypeEnumType",
  values: {
    SIMPLE: { value: TaskType.SIMPLE },
    CHECKLIST: { value: TaskType.CHECKLIST },
  },
});

export default TaskTypeEnumType;
