import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

const MAX_RESOURCE_FILE_SIZE_BYTES = 10_485_760;

const ResourceTypeSchema = z.enum(["LINK", "FILE"]);
const ResourceVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

const linkFieldsRefine = (data: {
  type: "LINK" | "FILE";
  url?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  size?: number | null;
}) => {
  if (data.type === "LINK") {
    return (
      data.url != null &&
      data.url !== "" &&
      (data.fileUrl == null || data.fileUrl === "") &&
      (data.fileName == null || data.fileName === "") &&
      (data.fileType == null || data.fileType === "") &&
      data.size == null
    );
  }
  return (
    (data.url == null || data.url === "") &&
    data.fileUrl != null &&
    data.fileUrl !== "" &&
    data.fileName != null &&
    data.fileName !== "" &&
    data.fileType != null &&
    data.fileType !== "" &&
    data.size != null
  );
};

const linkFieldsMessage = {
  message: "LINK requires url only; FILE requires fileUrl, fileName, fileType, and size",
  path: ["type"],
};

const privateViewerRefine = (data: { visibility: "PUBLIC" | "PRIVATE"; viewerIds?: string[] | null }) => {
  if (data.visibility === "PRIVATE") {
    return data.viewerIds != null && data.viewerIds.length > 0;
  }
  return true;
};

const privateViewerMessage = {
  message: "viewerIds must be a non-empty array when visibility is PRIVATE",
  path: ["viewerIds"],
};

export const GetResourcesSchema = z.object({
  projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetResourcesInputType = z.infer<typeof GetResourcesSchema>;

export const CreateResourceSchema = z
  .object({
    projectId: z.uuid(MESSAGE_MAP.INVALID("projectId", "UUID")).trim(),
    type: ResourceTypeSchema,
    title: z
      .string(MESSAGE_MAP.REQUIRED("title"))
      .trim()
      .min(1, MESSAGE_MAP.MIN("title", 1))
      .max(150, MESSAGE_MAP.MAX("title", 150)),
    url: z.url(MESSAGE_MAP.INVALID("url", "URL")).trim().optional().nullable(),
    fileUrl: z.url(MESSAGE_MAP.INVALID("fileUrl", "URL")).trim().optional().nullable(),
    fileName: z.string().trim().optional().nullable(),
    fileType: z.string().trim().optional().nullable(),
    size: z
      .number()
      .int()
      .min(1, MESSAGE_MAP.MIN("size", 1))
      .max(MAX_RESOURCE_FILE_SIZE_BYTES, MESSAGE_MAP.MAX("size", MAX_RESOURCE_FILE_SIZE_BYTES))
      .optional()
      .nullable(),
    visibility: ResourceVisibilitySchema.default("PUBLIC"),
    viewerIds: z.array(z.uuid(MESSAGE_MAP.INVALID("viewerIds", "UUID")).trim()).optional().nullable(),
    userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
    actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
  })
  .refine(linkFieldsRefine, linkFieldsMessage)
  .refine(privateViewerRefine, privateViewerMessage);

export type CreateResourceInputType = z.infer<typeof CreateResourceSchema>;

export const UpdateResourceSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  title: z
    .string()
    .trim()
    .min(1, MESSAGE_MAP.MIN("title", 1))
    .max(150, MESSAGE_MAP.MAX("title", 150))
    .optional(),
  visibility: ResourceVisibilitySchema.optional(),
  viewerIds: z.array(z.uuid(MESSAGE_MAP.INVALID("viewerIds", "UUID")).trim()).optional().nullable(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type UpdateResourceInputType = z.infer<typeof UpdateResourceSchema>;

export const DeleteResourceSchema = z.object({
  id: z.uuid(MESSAGE_MAP.INVALID("id", "UUID")).trim(),
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  actorId: z.uuid(MESSAGE_MAP.INVALID("actorId", "UUID")).trim(),
});

export type DeleteResourceInputType = z.infer<typeof DeleteResourceSchema>;
