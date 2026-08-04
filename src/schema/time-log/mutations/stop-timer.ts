import { StopTimerSchema } from "interfaces/time-log";

import { withValidation } from "utils/validation";

import { TimeLogType } from "..";
import { stopTimer } from "../services";

const StopTimer = {
  type: TimeLogType,
  args: {},
  resolve: (_root, _args, context) =>
    withValidation(stopTimer)({
      userId: context.userId,
      actorId: context.userId,
    }, StopTimerSchema),
};

export default StopTimer;
