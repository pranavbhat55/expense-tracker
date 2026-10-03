import { z } from "zod";

export const changeRoleSchema = z.object({
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export const auditLogQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().trim().min(1).optional(),
    entityType: z.string().trim().min(1).optional(),
});

export const createInvitationSchema = z.object({
    email: z.string().trim().email("Email must be valid"),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const workspaceSettingsSchema = z.object({
    inviteOnly: z.boolean(),
});
