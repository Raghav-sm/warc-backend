import { Permission } from "prisma-client/enums";
import { MESSAGE_MAP, VALIDATION_RULES } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetRoleSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
});

export type GetRoleInputType = z.infer<typeof GetRoleSchema>;

export const RoleFilterInputSchema = z
  .object({
    text: z.string().trim().optional().nullable(),
    permissionCodes: z
      .array(z.enum(Permission, MESSAGE_MAP.INVALID("permissionCodes", "Permission Code")))
      .optional()
      .nullable(),
  })
  .optional()
  .nullable();

export type RoleFilterInputType = z.infer<typeof RoleFilterInputSchema>;

export const GetRolesSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
  filters: RoleFilterInputSchema,
});

export type GetRolesInputType = z.infer<typeof GetRolesSchema>;

export const CreateRoleSchema = z.object({
  name: z
    .string(MESSAGE_MAP.REQUIRED("name"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("name"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  code: z
    .string(MESSAGE_MAP.REQUIRED("code"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("code"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  description: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("description"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  permissionCodes: z
    .array(
      z.enum(Permission, MESSAGE_MAP.INVALID("permissionCodes", "Permission Code")),
      MESSAGE_MAP.ARRAY_MIN_LENGTH("permissionCodes", 1),
    )
    .min(1, MESSAGE_MAP.ARRAY_MIN_LENGTH("permissionCodes", 1)),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateRoleInputType = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  name: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("name"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("description"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  permissionCodes: z
    .array(z.enum(Permission, MESSAGE_MAP.INVALID("permissionCodes", "Permission Code")))
    .min(1, MESSAGE_MAP.ARRAY_MIN_LENGTH("permissionCodes", 1))
    .optional()
    .nullable(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateRoleInputType = z.infer<typeof UpdateRoleSchema>;

export const DeleteRoleSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteRoleInputType = z.infer<typeof DeleteRoleSchema>;
