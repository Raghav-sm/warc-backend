/** GraphQL root field → Shield rule. Use any rule from graphql-rules.ts. */
import { Permission } from "prisma-client/client";

import { allowPublic, session, type ShieldRule, withPermission } from "./graphql-rules";

export const GRAPHQL_QUERY_RULES: Record<string, ShieldRule> = {
  // Auth Queries
  me: session,
  getSessions: session,

  // Dashboard
  getDashboard: session,

  // User Queries
  getUser: withPermission(Permission.USER_VIEW),
  getUsers: withPermission(Permission.USER_VIEW),

  // Role Queries
  getRole: withPermission(Permission.ROLE_VIEW),
  getRoles: withPermission(Permission.ROLE_VIEW),

  // Audit Log Queries
  getAuditLogs: withPermission(Permission.AUDIT_LOG_VIEW),
};

export const GRAPHQL_MUTATION_RULES: Record<string, ShieldRule> = {
  // Auth Mutations
  signUp: allowPublic,
  login: allowPublic,
  refreshToken: allowPublic,
  logout: session,
  updateUser: session,
  revokeSession: session,
  revokeOtherSessions: session,
  revokeAllSessions: session,

  // User Mutations
  createUser: withPermission(Permission.USER_CREATE),
  updateUserById: withPermission(Permission.USER_UPDATE),
  deleteUser: withPermission(Permission.USER_DELETE),
  assignUserRole: withPermission(Permission.USER_UPDATE),

  // Role Mutations
  createRole: withPermission(Permission.ROLE_MANAGE),
  updateRole: withPermission(Permission.ROLE_MANAGE),
  deleteRole: withPermission(Permission.ROLE_MANAGE),
};

export const resolveGraphqlShieldQueryAccess = (field: string) => {
  const rule = GRAPHQL_QUERY_RULES[field];
  if (!rule) throw new Error(`No shield rule for Query.${field}`);
  return rule;
};

export const resolveGraphqlShieldMutationAccess = (field: string) => {
  const rule = GRAPHQL_MUTATION_RULES[field];
  if (!rule) throw new Error(`No shield rule for Mutation.${field}`);
  return rule;
};
