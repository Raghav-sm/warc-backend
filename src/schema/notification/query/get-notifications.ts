import { GraphQLBoolean, GraphQLInt } from "graphql";

import { GetNotificationsSchema } from "interfaces/notification";

import { PAGINATION } from "utils/constants";
import { withValidation } from "utils/validation";

import { NotificationsType } from "..";
import { getNotifications } from "../services";

const GetNotifications = {
  type: NotificationsType,
  args: {
    page: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_PAGE },
    limit: { type: GraphQLInt, defaultValue: PAGINATION.DEFAULT_LIMIT },
    unreadOnly: { type: GraphQLBoolean },
  },
  resolve: (_root, { page, limit, unreadOnly }, context) =>
    withValidation(getNotifications)({
      page,
      limit,
      unreadOnly,
      userId: context.userId,
    }, GetNotificationsSchema),
};

export default GetNotifications;
