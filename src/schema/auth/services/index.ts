import { createHash, randomUUID } from "node:crypto";
import { getPrismaInstance, type PrismaInteractiveTransactionClient } from "datasources/prisma";
import { getCachedSession, invalidateSession, invalidateUser, setCachedSession } from "datasources/session-cache";
import type { LoginInputType, LogoutInputType, RefreshTokenInputType, SignUpInputType } from "interfaces/auth";
import type { Session } from "interfaces/graphql-context";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import type { Prisma } from "prisma-client/client";

import { UnauthenticatedException, ConflictException } from "utils/errors";
import { generateAccessToken, generateRefreshToken, verifyToken } from "utils/jwt";
import { hashPassword, verifyPassword } from "utils/misc";
import { hasProvided, isEmail } from "utils/validation";

const prisma = getPrismaInstance();

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = {
  rememberMe: 60 * ONE_DAY_MS,
  default: ONE_DAY_MS,
} as const;

type CreateSessionOptions = {
  rememberMe?: boolean | null;
};

function resolveSessionExpiresAt(options: CreateSessionOptions, now: Date): Date {
  const ttlMs = options.rememberMe === true ? SESSION_TTL_MS.rememberMe : SESSION_TTL_MS.default;
  return new Date(now.getTime() + ttlMs);
}

function refreshTokenExpiresInSeconds(expiresAt: Date, now: Date): number {
  return Math.max(1, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
}

async function createSessionTokens(
  userId: string,
  userAgent: string | undefined | null,
  ipAddress: string | undefined | null,
  options: CreateSessionOptions,
  transaction: PrismaInteractiveTransactionClient = prisma,
) {
  const now = new Date();
  const expiresAt = resolveSessionExpiresAt(options, now);
  if (expiresAt <= now) {
    throw new UnauthenticatedException("Refresh token is invalid or expired");
  }

  const sessionId = randomUUID();
  const accessToken = generateAccessToken(userId, sessionId);
  const refreshToken = generateRefreshToken(userId, sessionId, refreshTokenExpiresInSeconds(expiresAt, now));

  await transaction.refreshToken.create({
    data: {
      id: sessionId,
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return {
    sessionId,
    accessToken,
    refreshToken,
  };
}

async function rotateSessionTokens(
  persistedToken: {
    id: string;
    userId: string;
    expiresAt: Date;
    revoked: boolean;
  },
  inputRefreshToken: string,
  userAgent: string | undefined | null,
  ipAddress: string | undefined | null,
  transaction: PrismaInteractiveTransactionClient = prisma,
) {
  const now = new Date();
  if (persistedToken.revoked || persistedToken.expiresAt <= now) {
    throw new UnauthenticatedException("Refresh token is invalid or expired");
  }

  const sessionId = persistedToken.id;
  const userId = persistedToken.userId;
  const expiresAt = persistedToken.expiresAt;
  const accessToken = generateAccessToken(userId, sessionId);
  const refreshToken = generateRefreshToken(userId, sessionId, refreshTokenExpiresInSeconds(expiresAt, now));

  const rotateResult = await transaction.refreshToken.updateMany({
    where: {
      id: persistedToken.id,
      tokenHash: hashToken(inputRefreshToken),
      userId: persistedToken.userId,
      expiresAt: { gt: now },
      revoked: false,
    },
    data: {
      tokenHash: hashToken(refreshToken),
      userAgent,
      ipAddress,
    },
  });

  if (rotateResult.count !== 1) {
    throw new UnauthenticatedException("Refresh token is invalid or already used");
  }

  return {
    sessionId,
    accessToken,
    refreshToken,
  };
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  invalidateUser(userId);
}

function mapUserToSessionUser(user: Prisma.UserGetPayload<{ include: { role: true } }>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleCode: user.role.code,
    roleName: user.role.name,
    isActive: user.isActive,
    permissions: user.role.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(input: LoginInputType) {
  const identifier = input.emailOrEmployeeNumber;

  if (!isEmail(identifier)) {
    throw new UnauthenticatedException("Invalid email or password");
  }

  const user = await prisma.user.findUnique({
    where: { email: identifier },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthenticatedException("Invalid email or password");
  }

  const validPassword = verifyPassword(input.password, user.password);
  if (!validPassword) {
    throw new UnauthenticatedException("Invalid email or password");
  }

  const session = await createSessionTokens(user.id, input.userAgent, input.ipAddress, {
    rememberMe: input.rememberMe,
  });

  return {
    redirect: hasProvided(input.callbackUrl),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    url: input.callbackUrl,
  };
}

export async function signUp(input: SignUpInputType) {
  const viewerRole = await prisma.role.findUnique({ where: { code: "VIEWER" } });
  if (!viewerRole) {
    throw new ConflictException("Default viewer role is not configured");
  }

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new ConflictException("User already exists", "CONFLICT", { field: "email" });
    }

    const hash = hashPassword(input.password);
    const createdUser = await tx.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        password: hash,
        roleId: viewerRole.id,
      },
      include: { role: true },
    });

    const session = await createSessionTokens(
      createdUser.id,
      input.userAgent,
      input.ipAddress,
      {
        rememberMe: input.rememberMe,
      },
      tx,
    );

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  });
}

export async function refreshToken(input: RefreshTokenInputType) {
  return prisma.$transaction(async (tx) => {
    try {
      const tokenPayload = verifyToken<{ type: string }>(input.refreshToken);
      if (tokenPayload.type !== "refresh") {
        throw new UnauthenticatedException("Invalid refresh token type");
      }

      const persistedToken = await tx.refreshToken.findUnique({
        where: {
          tokenHash: hashToken(input.refreshToken),
        },
      });
      const now = new Date();
      if (!persistedToken || persistedToken.revoked || persistedToken.expiresAt <= now) {
        throw new UnauthenticatedException("Refresh token is invalid or expired");
      }
      if (persistedToken.id !== tokenPayload.jti || persistedToken.userId !== tokenPayload.sub) {
        throw new UnauthenticatedException("Refresh token is invalid");
      }

      const user = await tx.user.findUnique({
        where: { id: tokenPayload.sub },
      });
      if (!user) {
        throw new UnauthenticatedException("User not found for refresh token");
      }

      const tokenPair = await rotateSessionTokens(persistedToken, input.refreshToken, input.userAgent, input.ipAddress, tx);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };
    } catch (error) {
      if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
        throw new UnauthenticatedException("Refresh token is invalid or expired");
      }
      if (error instanceof UnauthenticatedException) throw error;
      throw new UnauthenticatedException("Refresh token verification failed");
    }
  });
}

export async function logout(input: LogoutInputType) {
  const tokenHash = hashToken(input.refreshToken);
  const persistedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true },
  });

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: {
      revoked: true,
      revokedAt: new Date(),
    },
  });

  if (persistedToken) {
    invalidateSession(persistedToken.userId, persistedToken.id);
  }
  return true;
}

export async function authenticateSession(request): Promise<Session | null> {
  if (!request?.headers?.authorization) {
    return null;
  }

  const [type, token] = request.headers.authorization.split(" ");
  if (type !== "Bearer" || !token) {
    return null;
  }

  try {
    const tokenPayload = verifyToken<{ type?: string }>(token);
    if (tokenPayload.type) {
      return null;
    }

    const userId = tokenPayload.sub;
    const sessionId = tokenPayload.jti;
    if (!userId || !sessionId) {
      return null;
    }

    const cachedSession = getCachedSession(userId, sessionId);
    if (cachedSession) {
      return cachedSession;
    }

    const now = new Date();
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.revoked || session.expiresAt <= now || session.userId !== userId) {
      throw new UnauthenticatedException("User is not authenticated. Session is invalid or expired");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthenticatedException("User is not authenticated. User not found or inactive");
    }

    const ttlSeconds = (session.expiresAt.getTime() - now.getTime()) / 1000;

    const userSession: Session = {
      type: "user",
      userId: user.id,
      roleId: user.roleId,
      permissions: user.role.permissions,
      user: mapUserToSessionUser(user),
    };
    setCachedSession(userId, sessionId, userSession, ttlSeconds);
    return userSession;
  } catch (error) {
    if (error instanceof UnauthenticatedException) throw error;
    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      throw new UnauthenticatedException("User is not authenticated. Session token is invalid");
    }
    throw new UnauthenticatedException("User is not authenticated. Session token verification failed");
  }
}
