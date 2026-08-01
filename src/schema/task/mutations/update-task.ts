import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import { UpdateTaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import TaskPriorityEnumType from "../enum/task-priority";
import TaskStatusEnumType from "../enum/task-status";
import TaskTypeEnumType from "../enum/task-type";
import { TaskType } from "..";
import { updateTask } from "../services";

const UpdateTask = {
  type: TaskType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    type: { type: TaskTypeEnumType },
    weight: { type: GraphQLInt },
    progress: { type: GraphQLInt },
    status: { type: TaskStatusEnumType },
    priority: { type: TaskPriorityEnumType },
    dueDate: { type: DateTimeScalar },
  },
  resolve: (_root, args, context) =>
    withValidation(updateTask)({
      ...args,
      userId: context.userId,
      actorId: context.userId,
    }, UpdateTaskSchema),
};

export default UpdateTask;
