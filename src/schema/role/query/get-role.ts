import { GraphQLID, GraphQLNonNull } from "graphql";

import { GetRoleSchema } from "interfaces/roles";

import { withValidation } from "utils/validation";

import { RoleType } from "..";
import { getRole } from "../services";

const GetRole = {
  type: new GraphQLNonNull(RoleType),
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }) => withValidation(getRole)({ id }, GetRoleSchema),
};

export default GetRole;
