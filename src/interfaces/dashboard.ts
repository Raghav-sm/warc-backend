import { z } from "zod";
import { MESSAGE_MAP } from "utils/validation";

export const GetDashboardSchema = z.object({
  userId: z.uuid(MESSAGE_MAP.INVALID("userId", "UUID")).trim(),
});

export type GetDashboardInputType = z.infer<typeof GetDashboardSchema>;
