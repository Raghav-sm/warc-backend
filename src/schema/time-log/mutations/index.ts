import CreateTimeLog from "./create-time-log";
import StartTimer from "./start-timer";
import StopTimer from "./stop-timer";

const TimeLogMutationFields = {
  startTimer: StartTimer,
  stopTimer: StopTimer,
  createTimeLog: CreateTimeLog,
};

export default TimeLogMutationFields;
