import { GraphQLEnumType } from "graphql";
import { Permission } from "prisma-client/enums";

const PermissionEnumType = new GraphQLEnumType({
  name: "PermissionEnumType",
  values: {
    USER_VIEW: { value: Permission.USER_VIEW },
    USER_CREATE: { value: Permission.USER_CREATE },
    USER_UPDATE: { value: Permission.USER_UPDATE },
    USER_DELETE: { value: Permission.USER_DELETE },
    ROLE_VIEW: { value: Permission.ROLE_VIEW },
    ROLE_MANAGE: { value: Permission.ROLE_MANAGE },
    SESSION_MANAGE: { value: Permission.SESSION_MANAGE },
    AUDIT_LOG_VIEW: { value: Permission.AUDIT_LOG_VIEW },
    PROJECT_CREATE: { value: Permission.PROJECT_CREATE },
    PROJECT_DELETE: { value: Permission.PROJECT_DELETE },
    PROJECT_EDIT: { value: Permission.PROJECT_EDIT },
    TASK_CREATE: { value: Permission.TASK_CREATE },
    TASK_EDIT_OWN: { value: Permission.TASK_EDIT_OWN },
    TASK_EDIT_ANY: { value: Permission.TASK_EDIT_ANY },
    TASK_DELETE: { value: Permission.TASK_DELETE },
    TASK_ASSIGN: { value: Permission.TASK_ASSIGN },
    TASK_CHANGE_STATUS: { value: Permission.TASK_CHANGE_STATUS },
    MEMBER_INVITE: { value: Permission.MEMBER_INVITE },
    MEMBER_REMOVE: { value: Permission.MEMBER_REMOVE },
    MEMBER_MANAGE_ROLES: { value: Permission.MEMBER_MANAGE_ROLES },
  },
});

export default PermissionEnumType;
