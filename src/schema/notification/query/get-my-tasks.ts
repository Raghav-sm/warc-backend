import { GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLString } from "graphql";

import { GetMyTasksSchema } from "interfaces/notification";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import TaskStatusEnumType from "schema/task/enum/task-status";

import { MyTasksType } from "..";
import { getMyTasks } from "../services";

const MyTaskFilterInputType = new GraphQLInputObjectType({
  name: "MyTaskFilterInputType",
  fields: () => ({
    projectId: { type: GraphQLID },
    status: { type: TaskStatusEnumType },
    assigneeId: { type: GraphQLID },
    text: { type: GraphQLString },
  }),
});

const GetMyTasks = {
  type: MyTasksType,
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: MyTaskFilterInputType },
  },
  resolve: (_root, { page, limit, filters }, context) =>
    withValidation(getMyTasks)({
      page,
      limit,
      filters,
      userId: context.userId,
    }, GetMyTasksSchema),
};

export default GetMyTasks;
