import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetProjectMembersSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { ProjectMembersType } from "..";
import { getProjectMembers } from "../services";

const GetProjectMembers = {
  type: new GraphQLNonNull(ProjectMembersType),
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId }, context) =>
    withValidation(getProjectMembers)({ projectId, userId: context.userId }, GetProjectMembersSchema),
};

export default GetProjectMembers;
