import { GraphQLID, GraphQLNonNull } from "graphql";

import { UpdateProjectMemberRoleSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { ProjectMemberType } from "..";
import { updateProjectMemberRole } from "../services";

const UpdateProjectMemberRole = {
  type: ProjectMemberType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    memberUserId: { type: new GraphQLNonNull(GraphQLID) },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId, memberUserId, roleId }, context) =>
    withValidation(updateProjectMemberRole)(
      {
        projectId,
        memberUserId,
        roleId,
        userId: context.userId,
        actorId: context.userId,
      },
      UpdateProjectMemberRoleSchema,
    ),
};

export default UpdateProjectMemberRole;
