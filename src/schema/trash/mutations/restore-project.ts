import { GraphQLID, GraphQLNonNull } from "graphql";

import { RestoreProjectSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { ProjectType } from "schema/project";

import { restoreProject } from "../services";

const RestoreProject = {
  type: new GraphQLNonNull(ProjectType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(restoreProject)(
      { id, userId: context.userId, actorId: context.userId },
      RestoreProjectSchema,
    ),
};

export default RestoreProject;
