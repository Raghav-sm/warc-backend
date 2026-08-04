import { GraphQLID, GraphQLNonNull } from "graphql";

import { StartTimerSchema } from "interfaces/time-log";

import { withValidation } from "utils/validation";

import { ActiveTimerType } from "..";
import { startTimer } from "../services";

const StartTimer = {
  type: ActiveTimerType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
  },
  resolve: (_root, { taskId }, context) =>
    withValidation(startTimer)({
      taskId,
      userId: context.userId,
      actorId: context.userId,
    }, StartTimerSchema),
};

export default StartTimer;
