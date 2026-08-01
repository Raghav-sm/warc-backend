/**
 * Reusable GraphQL Shield rules. Compose with `or` / `rule`, or add new exports here.
 * Field assignments live in `graphql-field-permissions.ts`.
 */
import { rule } from "graphql-shield";
import type { Permission } from "prisma-client/client";

import { ForbiddenException, UnauthenticatedException } from "utils/errors";

import { PUBLIC_OPERATIONS } from "./schema/auth/constants";

export { or, rule } from "graphql-shield";

export type ShieldRule = ReturnType<ReturnType<typeof rule>>;

/** Allows fields listed in `PUBLIC_OPERATIONS` (login, signup, refresh token). */
export const allowPublic: ShieldRule = rule({ cache: "contextual" })(async (_root, _args, _context, info) => {
  if (PUBLIC_OPERATIONS.has(info.fieldName)) {
    return true;
  }
  return new ForbiddenException("Forbidden");
});

/** Valid session; no permission required. */
export const session: ShieldRule = rule({ cache: "contextual" })(async (_root, _args, context) => {
  if (!context.isAuthenticated) {
    return new UnauthenticatedException("Authentication required");
  }
  return true;
});

/** Authenticated session with a specific permission code. */
export function withPermission(permissionCode: Permission): ShieldRule {
  return rule({ cache: "contextual" })(async (_root, _args, context) => {
    if (!context.isAuthenticated) {
      return new UnauthenticatedException("Authentication required");
    }

    const permissions = context.permissions ?? [];
    if (!permissions.includes(permissionCode)) {
      return new ForbiddenException("Forbidden");
    }

    return true;
  });
}
