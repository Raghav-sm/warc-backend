import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetProjectSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { ProjectType } from "..";
import { getProject } from "../services";

const GetProject = {
  type: new GraphQLNonNull(ProjectType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(getProject)({ id, userId: context.userId }, GetProjectSchema),
};

export default GetProject;
