import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateResourceSchema } from "interfaces/resource";

import { withValidation } from "utils/validation";

import ResourceVisibilityEnumType from "../enum/resource-visibility";
import { ResourceType } from "..";
import { updateResource } from "../services";

const UpdateResource = {
  type: ResourceType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: GraphQLString },
    visibility: { type: ResourceVisibilityEnumType },
    viewerIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
  },
  resolve: (_root, { id, title, visibility, viewerIds }, context) =>
    withValidation(updateResource)(
      {
        id,
        title,
        visibility,
        viewerIds,
        userId: context.userId,
        actorId: context.userId,
      },
      UpdateResourceSchema,
    ),
};

export default UpdateResource;
