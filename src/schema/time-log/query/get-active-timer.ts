import { GetActiveTimerSchema } from "interfaces/time-log";

import { withValidation } from "utils/validation";

import { ActiveTimerType } from "..";
import { getActiveTimer } from "../services";

const GetActiveTimer = {
  type: ActiveTimerType,
  args: {},
  resolve: (_root, _args, context) =>
    withValidation(getActiveTimer)({ userId: context.userId }, GetActiveTimerSchema),
};

export default GetActiveTimer;
