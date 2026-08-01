import AuthQueryFields from "./auth/query";
import AuditLogQueryFields from "./audit-log/query";
import DashboardQueryFields from "./dashboard/queries";
import RoleQueryFields from "./role/query";
import SessionQueryFields from "./session/queries";
import UserQueryFields from "./user/query";

const queryFields = {
  ...AuthQueryFields,
  ...UserQueryFields,
  ...SessionQueryFields,
  ...DashboardQueryFields,
  ...AuditLogQueryFields,
  ...RoleQueryFields,
};

export default queryFields;
