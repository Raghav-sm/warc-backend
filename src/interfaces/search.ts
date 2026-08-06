import { MESSAGE_MAP } from "utils/validation";
import z from "zod";

export const GlobalSearchSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
  query: z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters")
    .max(200, "Search query must be at most 200 characters"),
  limit: z
    .union([z.number().int().min(1).max(20), z.undefined(), z.null()])
    .transform((value) => value ?? 5),
});

export type GlobalSearchInputType = z.infer<typeof GlobalSearchSchema>;
