import { GraphQLID, GraphQLNonNull } from "graphql";

import { MarkNotificationReadSchema } from "interfaces/notification";

import { withValidation } from "utils/validation";

import { NotificationType } from "..";
import { markNotificationRead } from "../services";

const MarkNotificationRead = {
  type: NotificationType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { id }, context) =>
    withValidation(markNotificationRead)({
      id,
      userId: context.userId,
    }, MarkNotificationReadSchema),
};

export default MarkNotificationRead;
