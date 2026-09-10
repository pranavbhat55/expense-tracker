import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters"),

    email: z
        .string()
        .trim()
        .email("Email must be valid"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),

    workspaceSlug: z
        .string()
        .trim()
        .min(2)
        .max(64)
        .regex(/^[a-z0-9-]+$/, "Workspace slug may contain lowercase letters, numbers, and hyphens")
        .optional(),
});
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Email must be valid"),

    password: z
        .string()
        .min(1, "Password is required"),
});
