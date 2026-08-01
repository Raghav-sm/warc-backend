import type { User } from "./user";

interface AuthenticatedSession {
  type: "user";
  userId: string;
  roleId: string;
  permissions: string[];
}

export type Session = AuthenticatedSession & {
  user: User;
};

export type GraphQLContext = ((Session & { isAuthenticated: true }) | { isAuthenticated: false }) & {
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
};
