import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteProjectSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { deleteProject } from "../services";

const DeleteProject = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteProject)(
      {
        id,
        userId: context.userId,
        actorId: context.userId,
      },
      DeleteProjectSchema,
    ),
};

export default DeleteProject;
