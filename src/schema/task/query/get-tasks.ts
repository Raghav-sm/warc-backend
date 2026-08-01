import { GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { GetTasksSchema } from "interfaces/task";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import TaskStatusEnumType from "../enum/task-status";
import { TasksType } from "..";
import { getTasks } from "../services";

const TaskFilterInputType = new GraphQLInputObjectType({
  name: "TaskFilterInputType",
  fields: () => ({
    projectId: { type: GraphQLID },
    status: { type: TaskStatusEnumType },
    assigneeId: { type: GraphQLID },
    text: { type: GraphQLString },
  }),
});

const GetTasks = {
  type: new GraphQLNonNull(TasksType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: TaskFilterInputType },
  },
  resolve: (_root, { page, limit, filters }, context) =>
    withValidation(getTasks)({ page, limit, filters, userId: context.userId }, GetTasksSchema),
};

export default GetTasks;
