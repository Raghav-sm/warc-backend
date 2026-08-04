import { GraphQLBoolean } from "graphql";

import { MarkAllNotificationsReadSchema } from "interfaces/notification";

import { withValidation } from "utils/validation";

import { markAllNotificationsRead } from "../services";

const MarkAllNotificationsRead = {
  type: GraphQLBoolean,
  args: {},
  resolve: (_root, _args, context) =>
    withValidation(markAllNotificationsRead)({ userId: context.userId }, MarkAllNotificationsReadSchema),
};

export default MarkAllNotificationsRead;
