import { z } from "zod";

export const GetDashboardSchema = z.object({});

export type GetDashboardInputType = z.infer<typeof GetDashboardSchema>;
