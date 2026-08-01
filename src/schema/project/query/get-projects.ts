import { GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { GetProjectsSchema } from "interfaces/project";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import ProjectStatusEnumType from "../enum/project-status";
import { ProjectsType } from "..";
import { getProjects } from "../services";

const ProjectFilterInputType = new GraphQLInputObjectType({
  name: "ProjectFilterInputType",
  fields: () => ({
    text: { type: GraphQLString },
    status: { type: ProjectStatusEnumType },
  }),
});

const GetProjects = {
  type: new GraphQLNonNull(ProjectsType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: ProjectFilterInputType },
  },
  resolve: (_root, { page, limit, filters }, context) =>
    withValidation(getProjects)({ page, limit, filters, userId: context.userId }, GetProjectsSchema),
};

export default GetProjects;
