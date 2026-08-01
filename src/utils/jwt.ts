import { type JwtPayload, type SignOptions, sign, verify } from "jsonwebtoken";

const APP_SECRET = process.env.APP_SECRET || "12345";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "60d";

const APP_PRIVATE_KEY = process.env.APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
const APP_PUBLIC_KEY = process.env.APP_PUBLIC_KEY?.replace(/\\n/g, "\n");
const useAsymmetricKeys = Boolean(APP_PRIVATE_KEY && APP_PUBLIC_KEY);

export const generateAccessToken = (userId: string, sessionId: string): string => {
  if (useAsymmetricKeys) {
    return sign(
      {},
      APP_PRIVATE_KEY as string,
      {
        algorithm: "RS256",
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        jwtid: sessionId,
        subject: userId,
      } as SignOptions,
    );
  }

  return sign({}, APP_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    jwtid: sessionId,
    subject: userId,
  } as SignOptions);
};

export const generateRefreshToken = (
  userId: string,
  sessionId: string,
  expiresIn: string | number = REFRESH_TOKEN_EXPIRES_IN,
): string => {
  if (useAsymmetricKeys) {
    return sign(
      { type: "refresh" },
      APP_PRIVATE_KEY as string,
      {
        algorithm: "RS256",
        expiresIn,
        jwtid: sessionId,
        subject: userId,
      } as SignOptions,
    );
  }

  return sign({ type: "refresh" }, APP_SECRET, {
    expiresIn,
    jwtid: sessionId,
    subject: userId,
  } as SignOptions);
};

export const verifyToken = <T>(token: string): JwtPayload & T => {
  if (useAsymmetricKeys) {
    return verify(token, APP_PUBLIC_KEY as string, {
      algorithms: ["RS256"],
    }) as JwtPayload & T;
  }

  return verify(token, APP_SECRET) as JwtPayload & T;
};
