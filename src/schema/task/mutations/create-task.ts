import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import { CreateTaskSchema } from "interfaces/task";

import { withValidation } from "utils/validation";

import TaskPriorityEnumType from "../enum/task-priority";
import TaskTypeEnumType from "../enum/task-type";
import { TaskType } from "..";
import { createTask } from "../services";

const CreateTask = {
  type: TaskType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    type: { type: TaskTypeEnumType },
    weight: { type: new GraphQLNonNull(GraphQLInt) },
    priority: { type: TaskPriorityEnumType },
    dueDate: { type: DateTimeScalar },
  },
  resolve: (_root, { projectId, title, description, type, weight, priority, dueDate }, context) =>
    withValidation(createTask)({
      projectId,
      title,
      description,
      type,
      weight,
      priority,
      dueDate,
      userId: context.userId,
      actorId: context.userId,
    }, CreateTaskSchema),
};

export default CreateTask;
