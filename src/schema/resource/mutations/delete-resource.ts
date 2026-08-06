import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from "graphql";

import { DeleteResourceSchema } from "interfaces/resource";

import { withValidation } from "utils/validation";

import { deleteResource } from "../services";

const DeleteResource = {
  type: GraphQLBoolean,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(deleteResource)(
      {
        id,
        userId: context.userId,
        actorId: context.userId,
      },
      DeleteResourceSchema,
    ),
};

export default DeleteResource;
