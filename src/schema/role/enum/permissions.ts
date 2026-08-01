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
  },
});

export default PermissionEnumType;
