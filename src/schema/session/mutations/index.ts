import RevokeAllSessions from "./revoke-all-sessions";
import RevokeOtherSessions from "./revoke-other-sessions";
import RevokeSession from "./revoke-session";

const SessionMutationFields = {
  revokeSession: RevokeSession,
  revokeOtherSessions: RevokeOtherSessions,
  revokeAllSessions: RevokeAllSessions,
};

export default SessionMutationFields;
