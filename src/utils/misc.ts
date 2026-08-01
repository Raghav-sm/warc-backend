import { scryptSync } from "node:crypto";
import type { Request } from "express";
import ShortUniqueId from "short-unique-id";

export function generateReferenceId(length: number): string {
  const uid = new ShortUniqueId();
  return uid.randomUUID(length);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const salt = process.env.AUTHENTICATION_HASH_SALT || "";

export function hashPassword(password: string): string {
  const hash = scryptSync(password, salt, 64);

  const hashedPassword = `${hash.toString("hex")}.${salt}`;
  return hashedPassword;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [storedHash, salt] = hashedPassword.split(".");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return hash === storedHash;
}

export function resolveClientIp(req: Request): string | undefined {
  const toHeaderString = (value: string | string[] | undefined): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value[0];
    return undefined;
  };

  const normalizeIp = (value?: string): string | undefined => {
    if (!value) return undefined;

    // forwarded headers can be comma separated: client, proxy1, proxy2
    const firstValue = value.split(",")[0]?.trim();
    if (!firstValue) return undefined;

    // RFC 7239 Forwarded header example: for=203.0.113.5
    const forwardedMatch = firstValue.match(/for=(?:"?\[?)([^\];",]+)(?:\]?"?)/i);
    const candidate = (forwardedMatch?.[1] || firstValue).replace(/^::ffff:/, "").trim();

    // IPv4 with port (for example "1.2.3.4:54321")
    const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    return ipv4WithPort?.[1] || candidate;
  };

  const headerCandidates = [
    normalizeIp(toHeaderString(req.headers["cf-connecting-ip"])),
    normalizeIp(toHeaderString(req.headers["x-real-ip"])),
    normalizeIp(toHeaderString(req.headers["x-forwarded-for"])),
    normalizeIp(toHeaderString(req.headers.forwarded)),
  ].filter(Boolean) as string[];

  const nonLoopbackHeaderIp = headerCandidates.find((ip) => ip !== "::1" && ip !== "127.0.0.1");
  if (nonLoopbackHeaderIp) return nonLoopbackHeaderIp;

  const fallbackIp = normalizeIp(req.ip || req.socket.remoteAddress);
  return fallbackIp === "::1" ? "127.0.0.1" : fallbackIp;
}
