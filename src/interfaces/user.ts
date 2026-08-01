import { MESSAGE_MAP, VALIDATION_RULES } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  roleCode?: string;
  roleName?: string;
  isActive?: boolean;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const GetUserSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
});

export type GetUserInputType = z.infer<typeof GetUserSchema>;

export const UserFilterInputSchema = z
  .object({
    text: z.string().trim().optional().nullable(),
    roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim().optional().nullable(),
    isActive: z.boolean().optional().nullable(),
  })
  .optional()
  .nullable();

export type UserFilterInputType = z.infer<typeof UserFilterInputSchema>;

export const GetUsersSchema = z.object({
  page: PageSchema,
  limit: LimitSchema,
  filters: UserFilterInputSchema,
});

export type GetUsersInputType = z.infer<typeof GetUsersSchema>;

export const CreateUserSchema = z.object({
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
  roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateUserInputType = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  firstName: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("firstName"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  lastName: z
    .string()
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("lastName"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  email: z.email(MESSAGE_MAP.INVALID("email", "Email")).trim().optional().nullable(),
  roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim().optional().nullable(),
});

export type UpdateUserInputType = z.infer<typeof UpdateUserSchema>;

export const DeleteUserSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteUserInputType = z.infer<typeof DeleteUserSchema>;

export const AssignUserRoleSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type AssignUserRoleInputType = z.infer<typeof AssignUserRoleSchema>;
