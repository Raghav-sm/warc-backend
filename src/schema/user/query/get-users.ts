import { GraphQLBoolean, GraphQLID, GraphQLInputObjectType, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";

import { GetUsersSchema } from "interfaces/user";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { UsersType } from "..";
import { getUsers } from "../services";

const UserFilterInputType = new GraphQLInputObjectType({
  name: "UserFilterInputType",
  fields: () => ({
    text: { type: GraphQLString },
    roleId: { type: GraphQLID },
    isActive: { type: GraphQLBoolean },
  }),
});

const GetUsers = {
  type: new GraphQLNonNull(UsersType),
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    filters: { type: UserFilterInputType },
  },
  resolve: (_root, { page, limit, filters }) =>
    withValidation(getUsers)({ page, limit, filters }, GetUsersSchema),
};

export default GetUsers;
