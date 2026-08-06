import AuthQueryFields from "./auth/query";
import AuditLogQueryFields from "./audit-log/query";
import CommentQueryFields from "./comment/query";
import AttachmentQueryFields from "./attachment/query";
import ResourceQueryFields from "./resource/query";
import DashboardQueryFields from "./dashboard/queries";
import NotificationQueryFields from "./notification/query";
import ProjectQueryFields from "./project/query";
import RoleQueryFields from "./role/query";
import SessionQueryFields from "./session/queries";
import SearchQueryFields from "./search/query";
import TaskDependencyQueryFields from "./task-dependency/query";
import TaskQueryFields from "./task/query";
import TimeLogQueryFields from "./time-log/query";
import TrashQueryFields from "./trash/query";
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
  ...CommentQueryFields,
  ...AttachmentQueryFields,
  ...ResourceQueryFields,
  ...TaskDependencyQueryFields,
  ...TimeLogQueryFields,
  ...NotificationQueryFields,
  ...TrashQueryFields,
  ...SearchQueryFields,
};

export default queryFields;
