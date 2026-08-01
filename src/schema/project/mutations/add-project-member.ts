import { GraphQLID, GraphQLNonNull } from "graphql";

import { AddProjectMemberSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { ProjectMemberType } from "..";
import { addProjectMember } from "../services";

const AddProjectMember = {
  type: ProjectMemberType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    memberUserId: { type: new GraphQLNonNull(GraphQLID) },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId, memberUserId, roleId }, context) =>
    withValidation(addProjectMember)(
      {
        projectId,
        memberUserId,
        roleId,
        userId: context.userId,
        actorId: context.userId,
      },
      AddProjectMemberSchema,
    ),
};

export default AddProjectMember;
