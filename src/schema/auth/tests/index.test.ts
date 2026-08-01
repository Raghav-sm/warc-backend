import { createHash } from "node:crypto";

import {
  clearSessionCache,
  getCachedSession,
  invalidateCompanySessions,
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

type MemberSessionResult = Extract<Session, { type: "member" }>;

// Mirror the private token hashing used by the service so we can assert on persisted hashes.
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const VALID_PASSWORD = "ValidPass1!";

const credentialAccount = (password: string | null = hashPassword(VALID_PASSWORD)) => ({
  providerId: "credential",
  password,
});

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    image: null,
    emailVerified: true,
    activeCompanyId: null,
    accounts: [credentialAccount()],
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

  // Absolute expiry timestamp persisted on the refresh-token row of the most recent login.
  const persistedExpiry = () => prisma.refreshToken.create.mock.calls[0][0].data.expiresAt.getTime();

  it("authenticates a member by email and returns a verifiable token pair", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());

    const result = await login(baseInput());

    // Looked the user up by email (not by employeeNumber).
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      include: { accounts: true },
    });
    expect(prisma.employee.findUnique).not.toHaveBeenCalled();

    // Tokens are real, signed JWTs with the expected claims.
    const access = verifyToken<{ type?: string }>(result.accessToken);
    const refresh = verifyToken<{ type?: string }>(result.refreshToken);
    expect(access.sub).toBe("user-1");
    expect(access.type).toBeUndefined();
    expect(refresh.sub).toBe("user-1");
    expect(refresh.type).toBe("refresh");
    expect(access.jti).toBe(refresh.jti); // access + refresh share the session id

    // Persisted the refresh session with the hashed (never raw) token.
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    const created = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(created.id).toBe(refresh.jti);
    expect(created.userId).toBe("user-1");
    expect(created.tokenHash).toBe(hashToken(result.refreshToken));
    expect(created.userAgent).toBe("jest");
    expect(created.ipAddress).toBe("10.0.0.1");

    // No callbackUrl -> no redirect.
    expect(result.redirect).toBe(false);
    expect(result.url).toBeUndefined();
  });

  it("returns exactly the { redirect, accessToken, refreshToken, url } shape", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput());
    expect(Object.keys(result).sort()).toEqual(["accessToken", "redirect", "refreshToken", "url"]);
  });

  it("sets redirect + url when a callbackUrl is provided", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());

    const result = await login(baseInput({ callbackUrl: "https://app.example.com/home" }));

    expect(result.redirect).toBe(true);
    expect(result.url).toBe("https://app.example.com/home");
  });

  it("does not redirect when callbackUrl is null", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput({ callbackUrl: null }));
    expect(result.redirect).toBe(false);
    expect(result.url).toBeNull();
  });

  // IDEAL: an empty string is not a destination. A redirect must point somewhere; a blank
  // callbackUrl should behave exactly like "no callbackUrl" (redirect=false), not be echoed
  // back as a redirect target. `hasProvided` only rejects null/undefined, which is the gap.
  it("does not treat an empty-string callbackUrl as a redirect target", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput({ callbackUrl: "" }));
    expect(result.redirect).toBe(false);
  });

  // IDEAL: a whitespace-only callbackUrl is likewise not a real destination.
  it("does not treat a whitespace-only callbackUrl as a redirect target", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput({ callbackUrl: "   " }));
    expect(result.redirect).toBe(false);
  });

  it("uses a default (~1 day) session TTL when rememberMe is false", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const before = Date.now();
    await login(baseInput({ rememberMe: false }));
    const ttl = persistedExpiry() - before;
    expect(ttl).toBeGreaterThan(ONE_DAY_MS - 5_000);
    expect(ttl).toBeLessThan(ONE_DAY_MS + 5_000);
  });

  it("treats rememberMe=null as the default (~1 day) TTL", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const before = Date.now();
    await login(baseInput({ rememberMe: null }));
    const ttl = persistedExpiry() - before;
    expect(ttl).toBeGreaterThan(ONE_DAY_MS - 5_000);
    expect(ttl).toBeLessThan(ONE_DAY_MS + 5_000);
  });

  it("extends the session TTL to ~60 days when rememberMe is true", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const before = Date.now();
    await login(baseInput({ rememberMe: true }));
    const ttl = persistedExpiry() - before;
    expect(ttl).toBeGreaterThan(60 * ONE_DAY_MS - 5_000);
    expect(ttl).toBeLessThan(60 * ONE_DAY_MS + 5_000);
  });

  it("gives the refresh token an exp claim aligned with the persisted expiresAt", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput({ rememberMe: false }));
    const decoded = verifyToken<{ exp: number }>(result.refreshToken);
    expect(Math.abs(decoded.exp * 1000 - persistedExpiry())).toBeLessThan(5_000);
  });

  it("gives the access token a ~15 minute lifetime", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    const result = await login(baseInput());
    const decoded = verifyToken<{ exp: number; iat: number }>(result.accessToken);
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it("persists the session under the account user id even on an employeeNumber login", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-1" }),
    });
    await login(baseInput({ emailOrEmployeeNumber: "EMP-001" }));
    expect(prisma.refreshToken.create.mock.calls[0][0].data.userId).toBe("user-1");
  });

  it("persists undefined userAgent/ipAddress verbatim", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    await login(baseInput({ userAgent: undefined, ipAddress: undefined }));
    const { userAgent, ipAddress } = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(userAgent).toBeUndefined();
    expect(ipAddress).toBeUndefined();
  });

  // IDEAL: email addresses are effectively case-insensitive. `Jane@Example.com` and
  // `jane@example.com` are the same account, so the lookup must be normalized to lowercase —
  // otherwise a user who signed up lowercase can never log in with any other casing.
  it("normalizes email casing before looking the account up", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    await login(baseInput({ emailOrEmployeeNumber: "Jane@Example.com" }));
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      include: { accounts: true },
    });
    expect(prisma.employee.findUnique).not.toHaveBeenCalled();
  });

  // IDEAL: surrounding whitespace is almost always an input artifact (autofill, copy/paste)
  // and should be trimmed before the identifier is classified/looked up.
  it("trims surrounding whitespace on the identifier before lookup", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());
    await login(baseInput({ emailOrEmployeeNumber: "  jane@example.com  " }));
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      include: { accounts: true },
    });
  });

  it("selects the credential account even when other providers are present", async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        accounts: [{ providerId: "google", password: "irrelevant" }, credentialAccount()],
      }),
    );
    const result = await login(baseInput());
    expect(result.accessToken).toBeTruthy();
  });

  it("does not switch the active company on an email (member) login", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser({ activeCompanyId: "company-1" }));
    await login(baseInput());
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("resolves an employee by employeeNumber and switches the active company", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-1" }),
    });

    const result = await login(baseInput({ emailOrEmployeeNumber: "EMP-001" }));

    expect(prisma.employee.findUnique).toHaveBeenCalledWith({
      where: { employeeNumber: "EMP-001" },
      include: { user: { include: { accounts: true } } },
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    // Active company switched to the employee's company post-authentication.
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeCompanyId: "company-9" },
    });
    expect(result.accessToken).toBeTruthy();
  });

  it("does not switch the active company when it already matches", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-9" }),
    });

    await login(baseInput({ emailOrEmployeeNumber: "EMP-001" }));

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("routes a purely numeric identifier through the employeeNumber lookup", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-9" }),
    });
    await login(baseInput({ emailOrEmployeeNumber: "10001" }));
    expect(prisma.employee.findUnique).toHaveBeenCalledWith({
      where: { employeeNumber: "10001" },
      include: { user: { include: { accounts: true } } },
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("combines rememberMe + employeeNumber: switches company and uses a ~60 day TTL", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-1" }),
    });
    const before = Date.now();
    await login(baseInput({ emailOrEmployeeNumber: "EMP-001", rememberMe: true }));
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { activeCompanyId: "company-9" },
    });
    expect(persistedExpiry() - before).toBeGreaterThan(60 * ONE_DAY_MS - 5_000);
  });

  it("throws when the email does not resolve to a user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(login(baseInput())).rejects.toBeInstanceOf(UnauthenticatedException);
    await expect(login(baseInput())).rejects.toThrow("Invalid email or password");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("throws when the employeeNumber does not resolve to an employee", async () => {
    prisma.employee.findUnique.mockResolvedValue(null);

    await expect(login(baseInput({ emailOrEmployeeNumber: "EMP-404" }))).rejects.toThrow("Invalid email or password");
  });

  it("throws when the user has no credential account", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser({ accounts: [{ providerId: "google", password: "x" }] }));

    await expect(login(baseInput())).rejects.toThrow("Invalid email or password");
  });

  it("does not create a session when the user has no accounts at all", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser({ accounts: [] }));
    await expect(login(baseInput())).rejects.toThrow("Invalid email or password");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("throws when the credential account has no password", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser({ accounts: [credentialAccount(null)] }));

    await expect(login(baseInput())).rejects.toThrow("Invalid email or password");
  });

  it("throws when the password does not match", async () => {
    prisma.user.findUnique.mockResolvedValue(buildUser());

    await expect(login(baseInput({ password: "WrongPass1!" }))).rejects.toThrow("Invalid email or password");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects an employeeNumber login with the wrong password", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ activeCompanyId: "company-1" }),
    });
    await expect(login(baseInput({ emailOrEmployeeNumber: "EMP-001", password: "WrongPass1!" }))).rejects.toThrow(
      "Invalid email or password",
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects an employeeNumber login when the linked user has no credential account", async () => {
    prisma.employee.findUnique.mockResolvedValue({
      companyId: "company-9",
      user: buildUser({ accounts: [{ providerId: "google", password: "x" }] }),
    });
    await expect(login(baseInput({ emailOrEmployeeNumber: "EMP-001" }))).rejects.toThrow("Invalid email or password");
  });
});

describe("signUp", () => {
  const baseInput = (overrides: Partial<SignUpInputType> = {}): SignUpInputType =>
    ({
      firstName: "Jane",
      lastName: "Doe",
      email: "new@example.com",
      password: VALID_PASSWORD,
      image: undefined,
      rememberMe: undefined,
      callbackUrl: undefined,
      ipAddress: "10.0.0.1",
      userAgent: "jest",
      ...overrides,
    }) as SignUpInputType;

  const seedNewUser = () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "new-user-1", email: "new@example.com" });
  };

  it("creates a user + credential account and returns tokens (inside a transaction)", async () => {
    seedNewUser();

    const result = await signUp(baseInput());

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { firstName: "Jane", lastName: "Doe", email: "new@example.com" },
    });

    // Account is linked with a hashed password (verifiable round-trip), never plaintext.
    const accountData = prisma.account.create.mock.calls[0][0].data;
    expect(accountData.providerId).toBe("credential");
    expect(accountData.userId).toBe("new-user-1");
    expect(accountData.password).not.toBe(VALID_PASSWORD);
    expect(accountData.password).toBe(hashPassword(VALID_PASSWORD));

    // Session persisted for the new user.
    const refreshData = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(refreshData.userId).toBe("new-user-1");
    expect(refreshData.tokenHash).toBe(hashToken(result.refreshToken));

    const refresh = verifyToken<{ type?: string }>(result.refreshToken);
    expect(refresh.sub).toBe("new-user-1");
    expect(refresh.type).toBe("refresh");
  });

  it("returns exactly the { accessToken, refreshToken } shape", async () => {
    seedNewUser();
    const result = await signUp(baseInput());
    expect(Object.keys(result).sort()).toEqual(["accessToken", "refreshToken"]);
  });

  it("checks for an existing user by email before creating anything", async () => {
    seedNewUser();
    await signUp(baseInput());
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
  });

  it("links the credential account to the freshly created user id", async () => {
    seedNewUser();
    await signUp(baseInput());
    const { data } = prisma.account.create.mock.calls[0][0];
    expect(data.providerId).toBe("credential");
    expect(data.accountId).toBe("new-user-1");
    expect(data.userId).toBe("new-user-1");
  });

  it("stores a hash that verifies against the plaintext password (and rejects others)", async () => {
    seedNewUser();
    await signUp(baseInput());
    const { password } = prisma.account.create.mock.calls[0][0].data;
    expect(verifyPassword(VALID_PASSWORD, password)).toBe(true);
    expect(verifyPassword("NotThePassword1!", password)).toBe(false);
  });

  it("issues an access + refresh pair that share a session id for the new user", async () => {
    seedNewUser();
    const result = await signUp(baseInput());
    const access = verifyToken<{ type?: string }>(result.accessToken);
    const refresh = verifyToken<{ type?: string }>(result.refreshToken);
    expect(access.type).toBeUndefined();
    expect(refresh.type).toBe("refresh");
    expect(access.sub).toBe("new-user-1");
    expect(access.jti).toBe(refresh.jti);
  });

  it("persists the caller userAgent/ipAddress on the session row", async () => {
    seedNewUser();
    await signUp(baseInput({ userAgent: "agent-x", ipAddress: "203.0.113.7" }));
    const { data } = prisma.refreshToken.create.mock.calls[0][0];
    expect(data.userAgent).toBe("agent-x");
    expect(data.ipAddress).toBe("203.0.113.7");
    expect(data.userId).toBe("new-user-1");
  });

  it("honours rememberMe=true with a ~60 day session TTL", async () => {
    seedNewUser();
    const before = Date.now();
    await signUp(baseInput({ rememberMe: true }));
    const { expiresAt } = prisma.refreshToken.create.mock.calls[0][0].data;
    const ttl = expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(60 * ONE_DAY_MS - 5_000);
    expect(ttl).toBeLessThan(60 * ONE_DAY_MS + 5_000);
  });

  it("defaults to a ~1 day session TTL when rememberMe is falsy", async () => {
    seedNewUser();
    const before = Date.now();
    await signUp(baseInput({ rememberMe: false }));
    const { expiresAt } = prisma.refreshToken.create.mock.calls[0][0].data;
    const ttl = expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(ONE_DAY_MS - 5_000);
    expect(ttl).toBeLessThan(ONE_DAY_MS + 5_000);
  });

  it("runs the whole flow inside a single transaction", async () => {
    seedNewUser();
    await signUp(baseInput());
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("creates the user and links the account exactly once each", async () => {
    seedNewUser();
    await signUp(baseInput());
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.account.create).toHaveBeenCalledTimes(1);
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it("throws a ConflictException when the email already exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });

    await expect(signUp(baseInput())).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  // IDEAL: normalize the email (lowercase + trim) before the uniqueness check, otherwise
  // `John@X.com` and `john@x.com` register as two separate accounts for the same address.
  it("normalizes the email (lowercase + trim) before the uniqueness check", async () => {
    seedNewUser();
    await signUp(baseInput({ email: "  New@Example.com  " }));
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
  });

  // IDEAL: and persist it normalized, so the stored identity is canonical.
  it("stores the email normalized to lowercase", async () => {
    seedNewUser();
    await signUp(baseInput({ email: "New@Example.com" }));
    expect(prisma.user.create.mock.calls[0][0].data.email).toBe("new@example.com");
  });

  // IDEAL: the findUnique/create pair is racy — two concurrent signups can both pass the check.
  // A unique-constraint violation from the DB must be translated into the same ConflictException,
  // not leak a raw Prisma error to the caller.
  it("translates a duplicate-email DB constraint violation into a ConflictException", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const uniqueViolation = Object.assign(new Error("Unique constraint failed on the fields: (`email`)"), {
      code: "P2002",
    });
    prisma.user.create.mockRejectedValue(uniqueViolation);

    await expect(signUp(baseInput())).rejects.toBeInstanceOf(ConflictException);
  });

  it("surfaces conflict details (code, meta.field, http status) on duplicate email", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });
    await expect(signUp(baseInput())).rejects.toMatchObject({
      extensions: { code: "CONFLICT", meta: { field: "email" }, http: { status: 409 } },
    });
  });
});

describe("refreshToken", () => {
  const sessionId = "session-1";
  const userId = "user-1";

  const persisted = (overrides: Record<string, unknown> = {}) => ({
    id: sessionId,
    userId,
    revoked: false,
    expiresAt: new Date(Date.now() + ONE_DAY_MS),
    ...overrides,
  });

  const input = (token: string): RefreshTokenInputType =>
    ({ refreshToken: token, ipAddress: "10.0.0.2", userAgent: "jest" }) as RefreshTokenInputType;

  // Configure the mock so that `token` is a live, rotatable session.
  const seedValid = (token: string) => {
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ tokenHash: hashToken(token) }));
    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
  };

  it("rotates a valid refresh token and returns a fresh pair", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);

    const result = await refreshToken(input(token));

    // Looked the session up by the hash of the incoming token.
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashToken(token) },
    });
    // Rotation swaps the stored hash to the NEW refresh token's hash.
    const update = prisma.refreshToken.updateMany.mock.calls[0][0];
    expect(update.where.tokenHash).toBe(hashToken(token));
    expect(update.data.tokenHash).toBe(hashToken(result.refreshToken));
    expect(update.data.userAgent).toBe("jest");

    const refresh = verifyToken<{ type?: string }>(result.refreshToken);
    expect(refresh.sub).toBe(userId);
    expect(refresh.jti).toBe(sessionId);
    expect(refresh.type).toBe("refresh");
  });

  it("returns exactly the { accessToken, refreshToken } shape", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    const result = await refreshToken(input(token));
    expect(Object.keys(result).sort()).toEqual(["accessToken", "refreshToken"]);
  });

  it("returns a new access token with no type claim", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    const result = await refreshToken(input(token));
    expect(verifyToken<{ type?: string }>(result.accessToken).type).toBeUndefined();
  });

  it("re-issues an access token bound to the same user and session", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    const result = await refreshToken(input(token));
    const access = verifyToken<{ type?: string }>(result.accessToken);
    expect(access.sub).toBe(userId);
    expect(access.jti).toBe(sessionId);
  });

  it("issues a brand-new refresh token (never re-uses the incoming one)", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    const result = await refreshToken(input(token));
    expect(result.refreshToken).not.toBe(token);
    const decoded = verifyToken<{ type?: string }>(result.refreshToken);
    expect(decoded.jti).toBe(sessionId);
    expect(decoded.sub).toBe(userId);
    expect(decoded.type).toBe("refresh");
  });

  it("scopes the atomic rotation by id, user, revoked=false and a future expiry", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    await refreshToken(input(token));
    const { where, data } = prisma.refreshToken.updateMany.mock.calls[0][0];
    expect(where).toMatchObject({ id: sessionId, userId, revoked: false, tokenHash: hashToken(token) });
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
    expect(data).toMatchObject({ ipAddress: "10.0.0.2", userAgent: "jest" });
  });

  it("verifies the user still exists by the token subject before rotating", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    seedValid(token);
    await refreshToken(input(token));
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it('rejects a token whose type is not "refresh" (before any DB read)', async () => {
    const accessToken = generateAccessToken(userId, sessionId);

    await expect(refreshToken(input(accessToken))).rejects.toThrow("Invalid refresh token type");
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("rejects when no session row is found", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid or expired");
  });

  it("rejects when the persisted session is revoked", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ revoked: true, tokenHash: hashToken(token) }));

    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid or expired");
  });

  it("rejects when the persisted session has already expired", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(
      persisted({ tokenHash: hashToken(token), expiresAt: new Date(Date.now() - 1000) }),
    );
    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid or expired");
  });

  it("rejects when the persisted session belongs to a different user", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ userId: "someone-else", tokenHash: hashToken(token) }));

    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid");
  });

  it("rejects when the persisted session id does not match the token jti", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ id: "other-session", tokenHash: hashToken(token) }));
    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects when the user no longer exists", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ tokenHash: hashToken(token) }));
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(refreshToken(input(token))).rejects.toThrow("User not found for refresh token");
  });

  it("rejects when the atomic rotation matches no rows (token already used)", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ tokenHash: hashToken(token) }));
    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(refreshToken(input(token))).rejects.toThrow("Refresh token is invalid or already used");
  });

  // IDEAL: a valid-but-already-rotated refresh token is the classic signal of token theft
  // (the legitimate client rotated it; someone replayed the old one). Refresh-token rotation
  // best practice (RFC 6819 / OAuth BCP) says: on replay, revoke the whole session family so a
  // stolen token can't be traded for access. The service currently just throws and leaves the
  // attacker's other stolen tokens live.
  it("revokes the user's sessions when an already-rotated refresh token is replayed", async () => {
    const token = generateRefreshToken(userId, sessionId, 3600);
    prisma.refreshToken.findUnique.mockResolvedValue(persisted({ tokenHash: hashToken(token) }));
    prisma.user.findUnique.mockResolvedValue({ id: userId });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 }); // rotation matched nothing => replay

    await expect(refreshToken(input(token))).rejects.toThrow();
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId } });
  });

  it('maps an expired JWT to an "invalid or expired" error (before any DB read)', async () => {
    const expired = generateRefreshToken(userId, sessionId, -10);

    await expect(refreshToken(input(expired))).rejects.toThrow("Refresh token is invalid or expired");
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });

  it('maps a malformed JWT to an "invalid or expired" error (before any DB read)', async () => {
    await expect(refreshToken(input("not-a-real-jwt"))).rejects.toThrow("Refresh token is invalid or expired");
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("revokes the session matching the refresh token hash and returns true", async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const token = generateRefreshToken("user-1", "session-1", 3600);
    const result = await logout({ refreshToken: token } satisfies LogoutInputType);

    expect(result).toBe(true);
    const call = prisma.refreshToken.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ tokenHash: hashToken(token) });
    expect(call.data.revoked).toBe(true);
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });

  it("sets only revoked + revokedAt in the update payload", async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    await logout({ refreshToken: generateRefreshToken("u", "s", 3600) } satisfies LogoutInputType);
    const { data } = prisma.refreshToken.updateMany.mock.calls[0][0];
    expect(Object.keys(data).sort()).toEqual(["revoked", "revokedAt"]);
    expect(data.revoked).toBe(true);
    expect(data.revokedAt).toBeInstanceOf(Date);
  });

  it("issues exactly one revoke update and no other writes", async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    await logout({ refreshToken: generateRefreshToken("u", "s", 3600) } satisfies LogoutInputType);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });

  it("reads the session row (by token hash) so its cache entry can be evicted", async () => {
    const token = generateRefreshToken("u", "s", 3600);
    prisma.refreshToken.findUnique.mockResolvedValue({ id: "s", userId: "u" });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await logout({ refreshToken: token } satisfies LogoutInputType);

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true },
    });
  });

  it("returns a boolean true even when no session matched", async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    const result = await logout({ refreshToken: "whatever" } satisfies LogoutInputType);
    expect(typeof result).toBe("boolean");
    expect(result).toBe(true);
  });
});

describe("revokeAllUserRefreshTokens", () => {
  it("deletes exactly once, scoped to the given user", async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

    await revokeAllUserRefreshTokens("user-1");

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("resolves to undefined (fire-and-forget)", async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
    await expect(revokeAllUserRefreshTokens("user-1")).resolves.toBeUndefined();
  });

  it("does not touch sessions belonging to other flows", async () => {
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
    await revokeAllUserRefreshTokens("user-1");
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("authenticateSession", () => {
  const userId = "user-1";
  const sessionId = "session-1";

  const bearer = (token: string) => ({ headers: { authorization: `Bearer ${token}` } });
  const accessToken = () => generateAccessToken(userId, sessionId);

  const validSession = (overrides: Record<string, unknown> = {}) => ({
    id: sessionId,
    userId,
    revoked: false,
    expiresAt: new Date(Date.now() + ONE_DAY_MS),
    ...overrides,
  });

  it("returns null when there is no authorization header (and never queries the DB)", async () => {
    await expect(authenticateSession({})).resolves.toBeNull();
    await expect(authenticateSession({ headers: {} })).resolves.toBeNull();
    await expect(authenticateSession(undefined)).resolves.toBeNull();
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for a non-Bearer scheme or a missing token", async () => {
    await expect(authenticateSession({ headers: { authorization: "Basic abc" } })).resolves.toBeNull();
    await expect(authenticateSession({ headers: { authorization: "Bearer" } })).resolves.toBeNull();
  });

  // IDEAL: per RFC 7235 the auth-scheme token ("Bearer") is case-insensitive. A client that
  // sends `bearer <token>` is well within spec and must be authenticated, not treated as
  // anonymous. The service compares with a strict `!== 'Bearer'`, which is the gap.
  it("accepts a case-insensitive Bearer scheme (RFC 7235)", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));

    const session = await authenticateSession({ headers: { authorization: `bearer ${accessToken()}` } });
    expect(session).toMatchObject({ type: "none" });
  });

  it('rejects a non-Bearer "Token" scheme', async () => {
    await expect(authenticateSession({ headers: { authorization: "Token abc" } })).resolves.toBeNull();
  });

  it("returns null when a typed (refresh) token is used as an access token, without hitting the DB", async () => {
    const refresh = generateRefreshToken(userId, sessionId, 3600);
    await expect(authenticateSession(bearer(refresh))).resolves.toBeNull();
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("throws for a malformed bearer token", async () => {
    await expect(authenticateSession(bearer("garbage"))).rejects.toThrow("Session token is invalid");
  });

  it("throws when the session row is missing", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");
  });

  it("throws when the session row is revoked", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession({ revoked: true }));
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");
  });

  it("throws when the session row has expired", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");
  });

  it("throws when the session belongs to a different user", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession({ userId: "other" }));
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("Session is invalid or expired");
  });

  it("throws when the user no longer exists", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("User not found");
  });

  it('returns a "none" session (no company scoping, no permissions) when there is no active company', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));

    const session = (await authenticateSession(bearer(accessToken()))) as Session;

    expect(session).toMatchObject({
      type: "none",
      user: { id: userId, email: "jane@example.com", firstName: "Jane", lastName: "Doe", image: null },
    });
    expect(session).not.toHaveProperty("companyId");
    expect(session).not.toHaveProperty("permissions");
    expect(session.user).not.toHaveProperty("permissions");
    // Company/member/employee lookups are skipped entirely.
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it("throws when the active company cannot be found (after resolving member/company lookups)", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue(null);

    await expect(authenticateSession(bearer(accessToken()))).rejects.toThrow("not a member of the active company");
    expect(prisma.member.findFirst).toHaveBeenCalled();
    expect(prisma.company.findUnique).toHaveBeenCalledWith({
      where: { id: "company-1" },
      select: { type: true },
    });
  });

  it("returns a member session with permission codes derived from roles", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
      roles: [{ permissions: ["COMPANY_UPDATE", "ROLE_CREATE"] }],
    });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = await authenticateSession(bearer(accessToken()));

    expect(session).toMatchObject({
      type: "member",
      companyId: "company-1",
      companyType: "PRIVATE",
      memberId: "member-1",
      permissions: expect.arrayContaining(["company.update", "role.create"]),
    });
  });

  it("includes companyId, status and permissions on the member user object", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
      roles: [{ permissions: ["COMPANY_UPDATE"] }],
    });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session.user).toMatchObject({
      companyId: "company-1",
      status: "ACTIVE",
      permissions: ["company.update"],
    });
  });

  it("returns an empty permission list for an active member with no roles", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "ACTIVE", roles: [] });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as MemberSessionResult;
    expect(session.type).toBe("member");
    expect(session.permissions).toEqual([]);
    expect(session.user.permissions).toEqual([]);
  });

  it("de-duplicates permissions that appear across multiple roles", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
      roles: [{ permissions: ["COMPANY_UPDATE"] }, { permissions: ["COMPANY_UPDATE", "ROLE_CREATE"] }],
    });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as MemberSessionResult;
    expect(session.permissions).toHaveLength(2);
    expect(session.permissions).toEqual(expect.arrayContaining(["company.update", "role.create"]));
  });

  it("propagates the active company type onto a member session", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "ACTIVE", roles: [] });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "GOVERNMENT" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session).toMatchObject({ type: "member", companyId: "company-1", companyType: "GOVERNMENT" });
  });

  it("prefers a member session when the user is both a member and an employee", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "ACTIVE", roles: [] });
    prisma.employee.findFirst.mockResolvedValue({ id: "employee-1", status: "ACTIVE" });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session.type).toBe("member");
    expect(session).not.toHaveProperty("employeeId");
  });

  it("excludes an inactive member (falls through to null when no employee)", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "INACTIVE", roles: [] });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    await expect(authenticateSession(bearer(accessToken()))).resolves.toBeNull();
  });

  it("returns an employee session when the user is an employee (and not a member)", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({
      id: "employee-1",
      status: "ACTIVE",
      firstName: "Empl",
      lastName: "Oyee",
      profilePicture: "pic.png",
      employeeNumber: "EMP-001",
    });
    prisma.company.findUnique.mockResolvedValue({ type: "GOVERNMENT" });

    const session = await authenticateSession(bearer(accessToken()));

    expect(session).toMatchObject({
      type: "employee",
      companyId: "company-1",
      companyType: "GOVERNMENT",
      employeeId: "employee-1",
      user: { firstName: "Empl", lastName: "Oyee", image: "pic.png", employeeNumber: "EMP-001" },
    });
  });

  it("takes employee identity fields from the employee but keeps the account email", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(
      buildUser({ id: userId, activeCompanyId: "company-1", email: "account@example.com" }),
    );
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({
      id: "employee-1",
      status: "ACTIVE",
      firstName: "Empl",
      lastName: "Oyee",
      profilePicture: "pic.png",
      employeeNumber: "EMP-001",
    });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session.user.email).toBe("account@example.com");
    expect(session.user.firstName).toBe("Empl");
    expect(session.user.image).toBe("pic.png");
    expect(session.user.companyId).toBe("company-1");
  });

  it("accepts an ON_LEAVE employee as a valid employee session", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({
      id: "employee-1",
      status: "ON_LEAVE",
      firstName: "On",
      lastName: "Leave",
      profilePicture: null,
      employeeNumber: "EMP-050",
    });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session.type).toBe("employee");
    expect(session.user.status).toBe("ON_LEAVE");
  });

  it("returns null when the employee status is missing/undefined", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({ id: "employee-1", status: undefined });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    await expect(authenticateSession(bearer(accessToken()))).resolves.toBeNull();
  });

  it("returns null when the user is neither an active member nor a permitted employee", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({ id: "employee-1", status: "TERMINATED" });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    await expect(authenticateSession(bearer(accessToken()))).resolves.toBeNull();
  });

  it("looks the session up by the session id embedded in the token", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));
    await authenticateSession(bearer(accessToken()));
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { id: sessionId } });
  });

  it("uses the account email (not any employee email) on a member session", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(
      buildUser({ id: userId, activeCompanyId: "company-1", email: "member@example.com" }),
    );
    prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "ACTIVE", roles: [] });
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session.user.email).toBe("member@example.com");
  });

  it("does not attach a permissions field to an employee session", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(validSession());
    prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
    prisma.member.findFirst.mockResolvedValue(null);
    prisma.employee.findFirst.mockResolvedValue({
      id: "employee-1",
      status: "ACTIVE",
      firstName: "Empl",
      lastName: "Oyee",
      profilePicture: null,
      employeeNumber: "EMP-001",
    });
    prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

    const session = (await authenticateSession(bearer(accessToken()))) as Session;
    expect(session).not.toHaveProperty("permissions");
    expect(session.user).not.toHaveProperty("permissions");
  });

  // Real JWT lifetime checks need control over the clock, hence the local fake-timer setup.
  describe("token expiry (fake timers)", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("throws once the access token has passed its own expiry", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-01T00:00:00Z"));
      const token = generateAccessToken(userId, sessionId);

      // Access tokens live 15m; jump past that.
      jest.setSystemTime(new Date("2024-06-01T00:16:00Z"));
      await expect(authenticateSession(bearer(token))).rejects.toThrow("Session token is invalid");
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it("verifies a still-valid access token and proceeds to the session lookup", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-01T00:00:00Z"));
      const token = generateAccessToken(userId, sessionId);

      // Still within the 15m window -> verification passes, DB lookup runs.
      jest.setSystemTime(new Date("2024-06-01T00:14:00Z"));
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(authenticateSession(bearer(token))).rejects.toThrow("Session is invalid or expired");
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("session caching", () => {
    // Drive a full member-session resolution so the result is cacheable.
    const seedMemberSession = () => {
      prisma.refreshToken.findUnique.mockResolvedValue(validSession());
      prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
      prisma.member.findFirst.mockResolvedValue({
        id: "member-1",
        status: "ACTIVE",
        roles: [{ permissions: ["COMPANY_UPDATE"] }],
      });
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });
    };

    it("serves the second request from cache without re-querying the DB", async () => {
      seedMemberSession();

      const first = await authenticateSession(bearer(accessToken()));
      const second = await authenticateSession(bearer(accessToken()));

      expect(second).toEqual(first);
      // All five lookups ran exactly once — the second call was a pure cache hit.
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.member.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.employee.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
    });

    it(`populates the cache under the \`\${userId}:\${sessionId}\` key on a miss`, async () => {
      seedMemberSession();
      expect(getCachedSession(userId, sessionId)).toBeUndefined();

      const session = await authenticateSession(bearer(accessToken()));

      expect(getCachedSession(userId, sessionId)).toEqual(session);
    });

    it('caches a "none" session too', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(validSession());
      prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));

      await authenticateSession(bearer(accessToken()));
      await authenticateSession(bearer(accessToken()));

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(getCachedSession(userId, sessionId)).toMatchObject({ type: "none" });
    });

    it("does not cache a null (unresolved) result", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(validSession());
      prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: "company-1" }));
      prisma.member.findFirst.mockResolvedValue({ id: "member-1", status: "INACTIVE", roles: [] });
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.company.findUnique.mockResolvedValue({ type: "PRIVATE" });

      await expect(authenticateSession(bearer(accessToken()))).resolves.toBeNull();
      expect(getCachedSession(userId, sessionId)).toBeUndefined();
    });

    it("re-queries the DB after the specific session is invalidated", async () => {
      seedMemberSession();
      await authenticateSession(bearer(accessToken()));

      invalidateSession(userId, sessionId);

      await authenticateSession(bearer(accessToken()));
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledTimes(2);
    });

    it("re-queries the DB after the user is invalidated", async () => {
      seedMemberSession();
      await authenticateSession(bearer(accessToken()));

      invalidateUser(userId);

      await authenticateSession(bearer(accessToken()));
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledTimes(2);
    });

    it("derives the entry TTL from the session expiresAt (entry expires with the session)", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-01T00:00:00Z"));

      prisma.refreshToken.findUnique.mockResolvedValue(
        // Session expires 5 seconds from now.
        validSession({ expiresAt: new Date(Date.now() + 5_000) }),
      );
      prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));

      await authenticateSession(bearer(accessToken()));
      expect(getCachedSession(userId, sessionId)).toBeDefined();

      // Past the session expiry -> the cache entry is gone.
      jest.setSystemTime(new Date("2024-06-01T00:00:06Z"));
      expect(getCachedSession(userId, sessionId)).toBeUndefined();

      jest.useRealTimers();
    });

    it("caps the entry TTL so a long-lived (e.g. rememberMe) session cannot linger unbounded", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-01T00:00:00Z"));

      prisma.refreshToken.findUnique.mockResolvedValue(
        // Session lives 60 days, but the cache entry must expire far sooner (default cap 10 min).
        validSession({ expiresAt: new Date(Date.now() + 60 * ONE_DAY_MS) }),
      );
      prisma.user.findUnique.mockResolvedValue(buildUser({ id: userId, activeCompanyId: null }));

      await authenticateSession(bearer(accessToken()));

      // Still cached a few minutes in...
      jest.setSystemTime(new Date("2024-06-01T00:05:00Z"));
      expect(getCachedSession(userId, sessionId)).toBeDefined();

      // ...but gone well before the 60-day session expiry (past the 10 min cap).
      jest.setSystemTime(new Date("2024-06-01T00:11:00Z"));
      expect(getCachedSession(userId, sessionId)).toBeUndefined();

      jest.useRealTimers();
    });
  });
});

describe("session-cache invalidation helpers", () => {
  const prisma = mockPrisma;

  const cacheMember = (userId: string) => {
    // Seed the cache with a minimal session for the given user/session pair.
    const session = { type: "none", user: { id: userId } } as unknown as Session;
    setCachedSession(userId, `sess-${userId}`, session, 3600);
  };

  it("invalidateCompanySessions evicts every member and employee of the company", async () => {
    cacheMember("u-member");
    cacheMember("u-employee");
    prisma.member.findMany.mockResolvedValue([{ userId: "u-member" }]);
    prisma.employee.findMany.mockResolvedValue([{ userId: "u-employee" }]);

    await invalidateCompanySessions("company-1");

    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: { companyId: "company-1" },
      select: { userId: true },
    });
    expect(prisma.employee.findMany).toHaveBeenCalledWith({
      where: { companyId: "company-1" },
      select: { userId: true },
    });
    expect(getCachedSession("u-member", "sess-u-member")).toBeUndefined();
    expect(getCachedSession("u-employee", "sess-u-employee")).toBeUndefined();
  });

  it("invalidateRoleSessions evicts every member holding the role", async () => {
    cacheMember("u-holder");
    prisma.member.findMany.mockResolvedValue([{ userId: "u-holder" }]);

    await invalidateRoleSessions("role-1");

    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: { roles: { some: { id: "role-1" } } },
      select: { userId: true },
    });
    expect(getCachedSession("u-holder", "sess-u-holder")).toBeUndefined();
  });
});

describe("session-cache memory bounds", () => {
  // Default hard ceiling is 50_000 keys; overfill it and assert we never throw on the auth path.
  it("fails open (no throw) once the maxKeys ceiling is reached", () => {
    expect(() => {
      for (let i = 0; i < 50_050; i++) {
        setCachedSession(`user-${i}`, `sess-${i}`, { type: "none", user: { id: `user-${i}` } } as unknown as Session, 3600);
      }
    }).not.toThrow();
  });
});
