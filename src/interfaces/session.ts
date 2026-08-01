import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetSessionsSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetSessionsInputType = z.infer<typeof GetSessionsSchema>;

export const RevokeSessionsSchema = z.object({
  refreshToken: z.jwt(MESSAGE_MAP.INVALID("refreshToken", "JWT")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type RevokeSessionsInputType = z.infer<typeof RevokeSessionsSchema>;
