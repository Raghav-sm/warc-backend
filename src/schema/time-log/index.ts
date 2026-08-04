import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

export const TimeLogType = new GraphQLObjectType({
  name: "TimeLogType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    startedAt: { type: new GraphQLNonNull(DateTimeScalar) },
    endedAt: { type: DateTimeScalar },
    durationMinutes: { type: GraphQLInt },
    note: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    userFirstName: { type: GraphQLString },
    userLastName: { type: GraphQLString },
  }),
});

export const TimeLogsType = new GraphQLObjectType({
  name: "TimeLogsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TimeLogType))) },
    totalMinutes: { type: new GraphQLNonNull(GraphQLInt) },
  }),
});

export const ActiveTimerType = new GraphQLObjectType({
  name: "ActiveTimerType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    taskTitle: { type: GraphQLString },
    startedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});
