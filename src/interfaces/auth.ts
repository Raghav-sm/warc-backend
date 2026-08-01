import { MESSAGE_MAP, VALIDATION_RULES } from "utils/validation";
import z from "zod";

export const LoginSchema = z.object({
  emailOrEmployeeNumber: z
    .string(MESSAGE_MAP.REQUIRED("emailOrEmployeeNumber"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("emailOrEmployeeNumber")),
  password: z
    .string(MESSAGE_MAP.REQUIRED("password"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("password"))
    .regex(VALIDATION_RULES.PASSWORD.REGEX.value, VALIDATION_RULES.PASSWORD.REGEX.message),
  rememberMe: z.boolean().optional().nullable(),
  callbackUrl: z.url(MESSAGE_MAP.INVALID("callbackUrl", "URL")).trim().optional().nullable(),
  ipAddress: z.ipv4(MESSAGE_MAP.INVALID("ipAddress", "IP Address")).trim().optional().nullable(),
  userAgent: z.string().trim().optional().nullable(),
});

export type LoginInputType = z.infer<typeof LoginSchema>;

export const SignUpSchema = z.object({
  firstName: z
    .string(MESSAGE_MAP.REQUIRED("firstName"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("firstName"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  lastName: z
    .string(MESSAGE_MAP.REQUIRED("lastName"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("lastName"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  email: z.email(MESSAGE_MAP.INVALID("email", "Email")).trim(),
  password: z
    .string(MESSAGE_MAP.REQUIRED("password"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("password"))
    .regex(VALIDATION_RULES.PASSWORD.REGEX.value, VALIDATION_RULES.PASSWORD.REGEX.message),
  rememberMe: z.boolean().optional().nullable(),
  callbackUrl: z.url(MESSAGE_MAP.INVALID("callbackUrl", "URL")).trim().optional().nullable(),
  ipAddress: z.ipv4(MESSAGE_MAP.INVALID("ipAddress", "IP Address")).trim().optional().nullable(),
  userAgent: z.string().trim().optional().nullable(),
});

export type SignUpInputType = z.infer<typeof SignUpSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.jwt(MESSAGE_MAP.INVALID("refreshToken", "JWT")).trim(),
  ipAddress: z.ipv4(MESSAGE_MAP.INVALID("ipAddress", "IP Address")).trim().optional().nullable(),
  userAgent: z.string().trim().optional().nullable(),
});

export type RefreshTokenInputType = z.infer<typeof RefreshTokenSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.jwt(MESSAGE_MAP.INVALID("refreshToken", "JWT")).trim(),
});

export type LogoutInputType = z.infer<typeof LogoutSchema>;
