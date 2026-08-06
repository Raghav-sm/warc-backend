import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetResourcesSchema } from "interfaces/resource";

import { withValidation } from "utils/validation";

import { ResourcesType } from "..";
import { getResources } from "../services";

const GetResources = {
  type: ResourcesType,
  args: {
    projectId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { projectId }, context) =>
    withValidation(getResources)({ projectId, userId: context.userId }, GetResourcesSchema),
};

export default GetResources;
