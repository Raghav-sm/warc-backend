import { GraphQLEnumType } from "graphql";
import { ProjectStatus } from "prisma-client/enums";

const ProjectStatusEnumType = new GraphQLEnumType({
  name: "ProjectStatusEnumType",
  values: {
    ACTIVE: { value: ProjectStatus.ACTIVE },
    ARCHIVED: { value: ProjectStatus.ARCHIVED },
  },
});

export default ProjectStatusEnumType;
