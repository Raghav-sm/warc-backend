import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { RemoveProjectMemberSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { removeProjectMember } from "../services";

const RemoveProjectMember = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    memberUserId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId, memberUserId }, context) =>
    withValidation(removeProjectMember)(
      {
        projectId,
        memberUserId,
        userId: context.userId,
        actorId: context.userId,
      },
      RemoveProjectMemberSchema,
    ),
};

export default RemoveProjectMember;
