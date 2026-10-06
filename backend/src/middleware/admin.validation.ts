import { z } from "zod";

export const tenantSubscriptionStatusSchema = z.object({
    status: z.enum(["ACTIVE", "CANCELLED"]),
});
