import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { PermanentDeleteProjectSchema } from "interfaces/trash";

import { withValidation } from "utils/validation";

import { permanentDeleteProject } from "../services";

const PermanentDeleteProject = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(permanentDeleteProject)(
      { id, userId: context.userId, actorId: context.userId },
      PermanentDeleteProjectSchema,
    ),
};

export default PermanentDeleteProject;
