import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

import { CreateResourceSchema } from "interfaces/resource";

import { withValidation } from "utils/validation";

import ResourceTypeEnumType from "../enum/resource-type";
import ResourceVisibilityEnumType from "../enum/resource-visibility";
import { ResourceType } from "..";
import { createResource } from "../services";

const CreateResource = {
  type: ResourceType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(ResourceTypeEnumType) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    url: { type: GraphQLString },
    fileUrl: { type: GraphQLString },
    fileName: { type: GraphQLString },
    fileType: { type: GraphQLString },
    size: { type: GraphQLInt },
    visibility: { type: ResourceVisibilityEnumType },
    viewerIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
  },
  resolve: (
    _root,
    { projectId, type, title, url, fileUrl, fileName, fileType, size, visibility, viewerIds },
    context,
  ) =>
    withValidation(createResource)(
      {
        projectId,
        type,
        title,
        url,
        fileUrl,
        fileName,
        fileType,
        size,
        visibility,
        viewerIds,
        userId: context.userId,
        actorId: context.userId,
      },
      CreateResourceSchema,
    ),
};

export default CreateResource;
