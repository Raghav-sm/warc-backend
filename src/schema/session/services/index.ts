import { createHash } from "node:crypto";

import { getPrismaInstance } from "datasources/prisma";
import { invalidateSession, invalidateUser } from "datasources/session-cache";

import type { GetSessionsInputType, RevokeSessionsInputType } from "interfaces/session";

import { businessTimestamp } from "utils/date";
import { UnauthenticatedException } from "utils/errors";
import { verifyToken } from "utils/jwt";

const prisma = getPrismaInstance();

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function getSessions(input: GetSessionsInputType) {
  const [nodes, pageInfo] = await prisma.refreshToken
    .paginate({
      where: { userId: input.userId },
      orderBy: { createdAt: "desc" },
    })
    .withPages({
      page: input.page,
      limit: input.limit,
    });

  return { nodes, pageInfo };
}

export async function revokeSession(input: RevokeSessionsInputType) {
  const tokenPayload = verifyToken<{ type: string }>(input.refreshToken);
  if (tokenPayload.type !== "refresh") {
    throw new UnauthenticatedException("Invalid refresh token type");
  }
  if (tokenPayload.sub !== input.userId) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  const persistedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: hashToken(input.refreshToken),
    },
  });
  const now = businessTimestamp();
  if (!persistedToken || persistedToken.revoked || persistedToken.expiresAt <= now) {
    throw new UnauthenticatedException("Refresh token is invalid or expired");
  }
  if (persistedToken.id !== tokenPayload.jti || persistedToken.userId !== tokenPayload.sub) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  await prisma.refreshToken.update({
    where: { id: persistedToken.id },
    data: {
      revoked: true,
      revokedAt: now,
    },
  });

  invalidateSession(persistedToken.userId, persistedToken.id);

  return true;
}

export async function revokeOtherSessions(input: RevokeSessionsInputType) {
  const tokenPayload = verifyToken<{ type: string }>(input.refreshToken);
  if (tokenPayload.type !== "refresh") {
    throw new UnauthenticatedException("Invalid refresh token type");
  }
  if (tokenPayload.sub !== input.userId) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  const persistedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: hashToken(input.refreshToken),
    },
  });
  const now = businessTimestamp();
  if (!persistedToken || persistedToken.revoked || persistedToken.expiresAt <= now) {
    throw new UnauthenticatedException("Refresh token is invalid or expired");
  }
  if (persistedToken.id !== tokenPayload.jti || persistedToken.userId !== tokenPayload.sub) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  await prisma.refreshToken.updateMany({
    where: {
      id: { not: persistedToken.id },
      userId: tokenPayload.sub,
    },
    data: {
      revoked: true,
      revokedAt: now,
    },
  });

  // Evict all of the user's cached sessions; the surviving current session
  // simply repopulates from the DB on its next request.
  invalidateUser(tokenPayload.sub);

  return true;
}

export async function revokeAllSessions(input: RevokeSessionsInputType) {
  const tokenPayload = verifyToken<{ type: string }>(input.refreshToken);
  if (tokenPayload.type !== "refresh") {
    throw new UnauthenticatedException("Invalid refresh token type");
  }
  if (tokenPayload.sub !== input.userId) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  const persistedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: hashToken(input.refreshToken),
    },
  });
  const now = businessTimestamp();
  if (!persistedToken || persistedToken.revoked || persistedToken.expiresAt <= now) {
    throw new UnauthenticatedException("Refresh token is invalid or expired");
  }
  if (persistedToken.id !== tokenPayload.jti || persistedToken.userId !== tokenPayload.sub) {
    throw new UnauthenticatedException("Refresh token is invalid");
  }

  await prisma.refreshToken.updateMany({
    where: { userId: tokenPayload.sub },
    data: {
      revoked: true,
      revokedAt: now,
    },
  });

  invalidateUser(tokenPayload.sub);

  return true;
}
