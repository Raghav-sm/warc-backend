import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";

import { UpdateProjectSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import ProjectStatusEnumType from "../enum/project-status";
import { ProjectType } from "..";
import { updateProject } from "../services";

const UpdateProject = {
  type: ProjectType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: ProjectStatusEnumType },
  },
  resolve: (_root, { id, name, description, status }, context) =>
    withValidation(updateProject)(
      {
        id,
        name,
        description,
        status,
        userId: context.userId,
        actorId: context.userId,
      },
      UpdateProjectSchema,
    ),
};

export default UpdateProject;
