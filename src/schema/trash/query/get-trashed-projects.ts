import { GraphQLInt, GraphQLNonNull } from "graphql";

import { GetTrashedProjectsSchema } from "interfaces/trash";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { TrashedProjectsType } from "..";
import { getTrashedProjects } from "../services";

const GetTrashedProjects = {
  type: new GraphQLNonNull(TrashedProjectsType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
  },
  resolve: (_root, { page, limit }, context) =>
    withValidation(getTrashedProjects)({ page, limit, userId: context.userId }, GetTrashedProjectsSchema),
};

export default GetTrashedProjects;
