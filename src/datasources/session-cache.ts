import { getPrismaInstance } from "datasources/prisma";
import type { Session } from "interfaces/graphql-context";
import NodeCache from "node-cache";

const prisma = getPrismaInstance();

/**
 * In-memory cache of resolved `authenticateSession` results.
 */

const MAX_TTL_SECONDS = Number(process.env.SESSION_CACHE_TTL_SECONDS) || 10 * 60;
const MAX_KEYS = Number(process.env.SESSION_CACHE_MAX_KEYS) || 50_000;

const cache = new NodeCache({ useClones: false, maxKeys: MAX_KEYS, checkperiod: 120 });

const key = (userId: string, sessionId: string): string => `${userId}:${sessionId}`;

export function getCachedSession(userId: string, sessionId: string): Session | undefined {
  return cache.get<Session>(key(userId, sessionId));
}

export function setCachedSession(userId: string, sessionId: string, session: Session, ttlSeconds: number): void {
  const ttl = Math.max(1, Math.min(Math.floor(ttlSeconds), MAX_TTL_SECONDS));
  try {
    cache.set(key(userId, sessionId), session, ttl);
  } catch {
    // Fail open at maxKeys ceiling.
  }
}

/** Evict a single session (one device). */
export function invalidateSession(userId: string, sessionId: string): void {
  cache.del(key(userId, sessionId));
}

/** Evict every cached session for a user (all devices). */
export function invalidateUser(userId: string): void {
  const prefix = `${userId}:`;
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) {
    cache.del(keys);
  }
}

/** Evict every cached session for each of the given users (deduped). */
export function invalidateUsers(userIds: string[]): void {
  for (const userId of new Set(userIds)) {
    invalidateUser(userId);
  }
}

/** Test helper: drop the entire cache so suites don't leak state between cases. */
export function clearSessionCache(): void {
  cache.flushAll();
}

/**
 * Evict all sessions of everyone holding a given role. Use when a role's
 * permissions change, since those permissions are baked into cached sessions.
 */
export async function invalidateRoleSessions(roleId: string): Promise<void> {
  const holders = await prisma.user.findMany({
    where: { roleId },
    select: { id: true },
  });
  invalidateUsers((holders ?? []).map((holder) => holder.id));
}
