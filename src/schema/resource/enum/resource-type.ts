import { GraphQLEnumType } from "graphql";
import { ResourceType } from "prisma-client/enums";

const ResourceTypeEnumType = new GraphQLEnumType({
  name: "ResourceTypeEnumType",
  values: {
    LINK: { value: ResourceType.LINK },
    FILE: { value: ResourceType.FILE },
  },
});

export default ResourceTypeEnumType;
