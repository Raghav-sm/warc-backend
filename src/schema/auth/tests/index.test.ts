// @ts-nocheck — auth tests deferred; run via `yarn test` when ready (uses tsconfig.test.json).
import { createHash } from "node:crypto";

import {
  clearSessionCache,
  getCachedSession,
  invalidateRoleSessions,
  invalidateSession,
  invalidateUser,
  setCachedSession,
} from "datasources/session-cache";

import type { LoginInputType, LogoutInputType, RefreshTokenInputType, SignUpInputType } from "interfaces/auth";
import type { Session } from "interfaces/graphql-context";

import { ConflictException, UnauthenticatedException } from "utils/errors";
import { generateAccessToken, generateRefreshToken, verifyToken } from "utils/jwt";
import { hashPassword, verifyPassword } from "utils/misc";
import { mockPrisma, resetPrismaMock } from "utils/prisma-mock";

import { authenticateSession, login, logout, refreshToken, revokeAllUserRefreshTokens, signUp } from "../services";

const prisma = mockPrisma;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const VALID_PASSWORD = "ValidPass1!";

const viewerRole = {
  id: "role-viewer",
  code: "VIEWER",
  name: "Viewer",
  description: null,
  permissions: ["USER_VIEW", "ROLE_VIEW"],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
};

const adminRole = {
  id: "role-admin",
  code: "ADMIN",
  name: "Admin",
  description: null,
  permissions: ["USER_VIEW", "USER_CREATE", "USER_UPDATE", "ROLE_VIEW"],
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
};

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    password: hashPassword(VALID_PASSWORD),
    emailVerified: true,
    isActive: true,
    roleId: adminRole.id,
    role: adminRole,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  resetPrismaMock();
  clearSessionCache();
});

describe("login", () => {
  const baseInput = (overrides: Partial<LoginInputType> = {}): LoginInputType =>
    ({
      emailOrEmployeeNumber: "jane@example.com",
      password: VALID_PASSWORD,
      rememberMe: undefined,
      callbackUrl: undefined,
      ipAddress: "10.0.0.1",
      userAgent: "jest",
      ...overrides,
    }) as LoginInputType;

  const persistedExpiry = () => prisma.refreshToken.create.mock.calls[0][0].data.expiresAt.getTime();

  it("authenticates by email and returns a verifiable token pair", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());

    const result = await login(baseInput());

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      include: { role: true },
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(verifyToken(result.accessToken).sub).toBe("user-1");
    expect(verifyToken<{ type: string }>(result.refreshToken).type).toBe("refresh");
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);

    const created = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(created.userId).toBe("user-1");
    expect(created.userAgent).toBe("jest");
    expect(created.ipAddress).toBe("10.0.0.1");
    expect(created.tokenHash).toBe(hashToken(result.refreshToken));
  });

  it("rejects an unknown user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(login(baseInput())).rejects.toThrow(UnauthenticatedException);
  });

  it("rejects a wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    await expect(login(baseInput({ password: "WrongPass1!" }))).rejects.toThrow("Invalid email or password");
  });

  it("rejects an inactive user", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser({ isActive: false }));
    await expect(login(baseInput())).rejects.toThrow("Invalid email or password");
  });

  it("rejects a non-email identifier", async () => {
    await expect(login(baseInput({ emailOrEmployeeNumber: "EMP-001" }))).rejects.toThrow("Invalid email or password");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("uses a default (~1 day) session TTL when rememberMe is false", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const before = Date.now();
    await login(baseInput({ rememberMe: false }));
    const after = Date.now() + ONE_DAY_MS;
    expect(persistedExpiry()).toBeGreaterThanOrEqual(before + ONE_DAY_MS);
    expect(persistedExpiry()).toBeLessThanOrEqual(after);
  });

  it("extends the session TTL to ~60 days when rememberMe is true", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const before = Date.now();
    await login(baseInput({ rememberMe: true }));
    const after = Date.now() + 60 * ONE_DAY_MS;
    expect(persistedExpiry()).toBeGreaterThanOrEqual(before + 60 * ONE_DAY_MS);
    expect(persistedExpiry()).toBeLessThanOrEqual(after);
  });

  it("returns redirect metadata when callbackUrl is provided", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput({ callbackUrl: "https://app.example.com/dashboard" }));
    expect(result.redirect).toBe(true);
    expect(result.url).toBe("https://app.example.com/dashboard");
  });
});

describe("signUp", () => {
  const baseInput = (overrides: Partial<SignUpInputType> = {}): SignUpInputType =>
    ({
      firstName: "Jane",
      lastName: "Doe",
      email: "new@example.com",
      password: VALID_PASSWORD,
      rememberMe: undefined,
      callbackUrl: undefined,
      ipAddress: "10.0.0.1",
      userAgent: "jest",
      ...overrides,
    }) as SignUpInputType;

  it("creates a user with the default VIEWER role and returns tokens", async () => {
    prisma.role.findUnique.mockResolvedValue(viewerRole);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(
      buildUser({
        id: "user-new",
        email: "new@example.com",
        roleId: viewerRole.id,
        role: viewerRole,
      }),
    );

    const result = await signUp(baseInput());

    expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { code: "VIEWER" } });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@example.com",
          roleId: viewerRole.id,
          password: expect.any(String),
        }),
      }),
    );
    expect(verifyPassword(VALID_PASSWORD, prisma.user.create.mock.calls[0][0].data.password)).toBe(true);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    prisma.role.findUnique.mockResolvedValue(viewerRole);
    prisma.user.findUnique.mockResolvedValue(buildUser({ email: "new@example.com" }));

    await expect(signUp(baseInput())).rejects.toThrow(ConflictException);
  });

  it("throws when the VIEWER role is not configured", async () => {
    prisma.role.findUnique.mockResolvedValue(null);
    await expect(signUp(baseInput())).rejects.toThrow("Default viewer role is not configured");
  });
});

describe("refreshToken", () => {
  const userId = "user-1";
  const sessionId = "session-1";

  const baseInput = (token: string, overrides: Partial<RefreshTokenInputType> = {}): RefreshTokenInputType =>
    ({
      refreshToken: token,
      ipAddress: "10.0.0.2",
      userAgent: "jest-refresh",
      ...overrides,
    }) as RefreshTokenInputType;

  const validPersistedToken = (overrides: Record<string, unknown> = {}) => ({
    id: sessionId,
    userId,
    tokenHash: "",
    revoked: false,
    expiresAt: new Date(Date.now() + ONE_DAY_MS),
    ...overrides,
  });

  it("rotates tokens for a valid refresh token", async () => {
    const initialRefresh = generateRefreshToken(userId, sessionId, 3600);
    const persisted = validPersistedToken({ tokenHash: hashToken(initialRefresh) });
    prisma.refreshToken.findUnique.mockResolvedValue(persisted);
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId }));
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await refreshToken(baseInput(initialRefresh));

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(initialRefresh);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: sessionId,
          userId,
          tokenHash: hashToken(initialRefresh),
          revoked: false,
        }),
        data: expect.objectContaining({
          userAgent: "jest-refresh",
          ipAddress: "10.0.0.2",
        }),
      }),
    );
  });

  it("rejects an expired refresh token", async () => {
    const initialRefresh = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(
      validPersistedToken({
        tokenHash: hashToken(initialRefresh),
        expiresAt: new Date(Date.now() - 1000),
      }),
    );

    await expect(refreshToken(baseInput(initialRefresh))).rejects.toThrow("Refresh token is invalid or expired");
  });

  it("rejects a revoked refresh token", async () => {
    const initialRefresh = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(
      validPersistedToken({
        tokenHash: hashToken(initialRefresh),
        revoked: true,
      }),
    );

    await expect(refreshToken(baseInput(initialRefresh))).rejects.toThrow("Refresh token is invalid or expired");
  });

  it("rejects when the persisted token does not match the JWT claims", async () => {
    const initialRefresh = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(
      validPersistedToken({
        tokenHash: hashToken(initialRefresh),
        id: "other-session",
      }),
    );

    await expect(refreshToken(baseInput(initialRefresh))).rejects.toThrow("Refresh token is invalid");
  });
});

describe("logout", () => {
  const userId = "user-1";
  const sessionId = "session-1";

  it("revokes the refresh token and clears the session cache", async () => {
    const refresh = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: sessionId, userId });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    setCachedSession(userId, sessionId, { type: "user", userId, roleId: adminRole.id, permissions: [], user: buildUser() }, 3600);
    expect(getCachedSession(userId, sessionId)).toBeDefined();

    await expect(logout({ refreshToken: refresh } as LogoutInputType)).resolves.toBe(true);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashToken(refresh) },
      data: expect.objectContaining({ revoked: true }),
    });
    expect(getCachedSession(userId, sessionId)).toBeUndefined();
  });
});

describe("revokeAllUserRefreshTokens", () => {
  it("deletes all refresh tokens and evicts cached sessions for the user", async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
    setCachedSession("user-1", "sess-1", { type: "user", userId: "user-1", roleId: adminRole.id, permissions: [], user: buildUser() }, 3600);

    await revokeAllUserRefreshTokens("user-1");

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(getCachedSession("user-1", "sess-1")).toBeUndefined();
  });
});

describe("authenticateSession", () => {
  const userId = "user-1";
  const sessionId = "session-1";

  const bearer = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });
  const accessToken = () => generateAccessToken(userId, sessionId);

  const validSessionRow = (overrides: Record<string, unknown> = {}) => ({
    id: sessionId,
    userId,
    revoked: false,
    expiresAt: new Date(Date.now() + ONE_DAY_MS),
    ...overrides,
  });

  it("returns null when there is no authorization header", async () => {
    await expect(authenticateSession({})).resolves.toBeNull();
    await expect(authenticateSession({ headers: {} })).resolves.toBeNull();
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for a non-Bearer scheme", async () => {
    await expect(authenticateSession({ headers: { authorization: "Basic abc" } })).resolves.toBeNull();
  });

  it("returns null when a refresh token is used as an access token", async () => {
    const refresh = generateRefreshToken(userId, sessionId, 3600);
    await expect(authenticateSession(bearer(refresh))).resolves.toBeNull();
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });

  it("throws when the session row is missing or expired", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");

    prisma.refreshToken.findUnique.mockResolvedValue(
      validSessionRow({ expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");
  });

  it("returns a user session with role permissions", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSessionRow());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId }));

    const session = await authenticateSession(bearer(accessToken()));

    expect(session).toMatchObject({
      type: "user",
      userId,
      roleId: adminRole.id,
      permissions: adminRole.permissions,
    });
    expect(session?.user).toMatchObject({
      email: "jane@example.com",
      roleCode: "ADMIN",
      permissions: adminRole.permissions,
    });
  });

  it("reuses the session cache on subsequent calls", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSessionRow());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId }));

    await authenticateSession(bearer(accessToken()));
    await authenticateSession(bearer(accessToken()));

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("throws when the user is inactive", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSessionRow());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, isActive: false }));

    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("User not found or inactive");
  });
});

describe("session-cache helpers", () => {
  const prismaMock = mockPrisma;

  const cacheUserSession = (userId: string) => {
    const session = {
      type: "user",
      userId,
      roleId: adminRole.id,
      permissions: [],
      user: buildUser({ id: userId }),
    } as Session;
    setCachedSession(userId, `sess-${userId}`, session, 3600);
  };

  it("invalidateSession evicts a single cached session", () => {
    cacheUserSession("user-1");
    invalidateSession("user-1", "sess-user-1");
    expect(getCachedSession("user-1", "sess-user-1")).toBeUndefined();
  });

  it("invalidateUser evicts every cached session for a user", () => {
    cacheUserSession("user-1");
    setCachedSession("user-1", "sess-other", { type: "user", userId: "user-1", roleId: adminRole.id, permissions: [], user: buildUser() }, 3600);
    invalidateUser("user-1");
    expect(getCachedSession("user-1", "sess-user-1")).toBeUndefined();
    expect(getCachedSession("user-1", "sess-other")).toBeUndefined();
  });

  it("invalidateRoleSessions evicts platform users and project members holding the role", async () => {
    cacheUserSession("u-platform");
    cacheUserSession("u-project");
    prismaMock.user.findMany.mockResolvedValue([{ id: "u-platform" }]);
    prismaMock.projectMember.findMany.mockResolvedValue([{ userId: "u-project" }]);

    await invalidateRoleSessions("role-1");

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: { roleId: "role-1" },
      select: { id: true },
    });
    expect(prismaMock.projectMember.findMany).toHaveBeenCalledWith({
      where: { roleId: "role-1" },
      select: { userId: true },
    });
    expect(getCachedSession("u-platform", "sess-u-platform")).toBeUndefined();
    expect(getCachedSession("u-project", "sess-u-project")).toBeUndefined();
  });

  it("fails open once the maxKeys ceiling is reached", () => {
    expect(() => {
      for (let i = 0; i < 50_050; i++) {
        setCachedSession(
          `user-${i}`,
          `sess-${i}`,
          { type: "user", userId: `user-${i}`, roleId: adminRole.id, permissions: [], user: buildUser({ id: `user-${i}` }) },
          3600,
        );
      }
    }).not.toThrow();
  });
});
