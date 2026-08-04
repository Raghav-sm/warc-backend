import { GraphQLID, GraphQLNonNull, GraphQLString } from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import { CreateTimeLogSchema } from "interfaces/time-log";

import { withValidation } from "utils/validation";

import { TimeLogType } from "..";
import { createTimeLog } from "../services";

const CreateTimeLog = {
  type: TimeLogType,
  args: {
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    startedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    endedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    note: { type: GraphQLString },
  },
  resolve: (_root, { taskId, startedAt, endedAt, note }, context) =>
    withValidation(createTimeLog)({
      taskId,
      startedAt,
      endedAt,
      note,
      userId: context.userId,
      actorId: context.userId,
    }, CreateTimeLogSchema),
};

export default CreateTimeLog;
