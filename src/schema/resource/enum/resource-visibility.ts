import { GraphQLEnumType } from "graphql";
import { ResourceVisibility } from "prisma-client/enums";

const ResourceVisibilityEnumType = new GraphQLEnumType({
  name: "ResourceVisibilityEnumType",
  values: {
    PUBLIC: { value: ResourceVisibility.PUBLIC },
    PRIVATE: { value: ResourceVisibility.PRIVATE },
  },
});

export default ResourceVisibilityEnumType;
