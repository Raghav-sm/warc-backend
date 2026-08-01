import AuthQueryFields from "./auth/query";
import AuditLogQueryFields from "./audit-log/query";
import DashboardQueryFields from "./dashboard/queries";
import ProjectQueryFields from "./project/query";
import RoleQueryFields from "./role/query";
import SessionQueryFields from "./session/queries";
import TaskQueryFields from "./task/query";
import UserQueryFields from "./user/query";

const queryFields = {
  ...AuthQueryFields,
  ...UserQueryFields,
  ...SessionQueryFields,
  ...DashboardQueryFields,
  ...AuditLogQueryFields,
  ...RoleQueryFields,
  ...ProjectQueryFields,
  ...TaskQueryFields,
};

export default queryFields;
