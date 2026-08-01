import { GraphQLNonNull, GraphQLString } from "graphql";

import { CreateProjectSchema } from "interfaces/project";

import { withValidation } from "utils/validation";

import { ProjectType } from "..";
import { createProject } from "../services";

const CreateProject = {
  type: ProjectType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
  },
  resolve: (_root, { name, description }, context) =>
    withValidation(createProject)(
      {
        name,
        description,
        userId: context.userId,
        actorId: context.userId,
      },
      CreateProjectSchema,
    ),
};

export default CreateProject;
