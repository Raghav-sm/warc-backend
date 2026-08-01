import { ProjectStatus } from "prisma-client/enums";
import { MESSAGE_MAP, VALIDATION_RULES } from "utils/validation";
import z from "zod";

import { LimitSchema, PageSchema } from "./pagination";

export const GetProjectSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetProjectInputType = z.infer<typeof GetProjectSchema>;

export const ProjectFilterInputSchema = z
  .object({
    text: z.string().trim().optional().nullable(),
    status: z.enum(ProjectStatus, MESSAGE_MAP.INVALID("status", "Project Status")).optional().nullable(),
  })
  .optional()
  .nullable();

export type ProjectFilterInputType = z.infer<typeof ProjectFilterInputSchema>;

export const GetProjectsSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  page: PageSchema,
  limit: LimitSchema,
  filters: ProjectFilterInputSchema,
});

export type GetProjectsInputType = z.infer<typeof GetProjectsSchema>;

export const GetProjectMembersSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetProjectMembersInputType = z.infer<typeof GetProjectMembersSchema>;

export const CreateProjectSchema = z.object({
  name: z
    .string(MESSAGE_MAP.REQUIRED("name"))
    .trim()
    .nonempty(MESSAGE_MAP.EMPTY("name"))
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message),
  description: z
    .string()
    .trim()
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type CreateProjectInputType = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
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
    .regex(VALIDATION_RULES.STRING.REGEX.value, VALIDATION_RULES.STRING.REGEX.message)
    .optional()
    .nullable(),
  status: z.enum(ProjectStatus, MESSAGE_MAP.INVALID("status", "Project Status")).optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateProjectInputType = z.infer<typeof UpdateProjectSchema>;

export const DeleteProjectSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteProjectInputType = z.infer<typeof DeleteProjectSchema>;

export const AddProjectMemberSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  memberUserId: z.uuid(MESSAGE_MAP.INVALID("memberUserId", "UUID")).trim(),
  roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type AddProjectMemberInputType = z.infer<typeof AddProjectMemberSchema>;

export const UpdateProjectMemberRoleSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  memberUserId: z.uuid(MESSAGE_MAP.INVALID("memberUserId", "UUID")).trim(),
  roleId: z.uuid(MESSAGE_MAP.INVALID("roleId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateProjectMemberRoleInputType = z.infer<typeof UpdateProjectMemberRoleSchema>;

export const RemoveProjectMemberSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  memberUserId: z.uuid(MESSAGE_MAP.INVALID("memberUserId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type RemoveProjectMemberInputType = z.infer<typeof RemoveProjectMemberSchema>;
