import { describe, expect, it } from "vitest";
import { auditLogQuerySchema, changeRoleSchema } from "../middleware/workspace.validation.js";

describe("workspace request validation", () => {
    it("only accepts supported workspace roles", () => {
        expect(changeRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
        expect(changeRoleSchema.safeParse({ role: "ROOT" }).success).toBe(false);
    });

    it("bounds audit log pagination", () => {
        expect(auditLogQuerySchema.safeParse({ page: "1", limit: "20" }).success).toBe(true);
        expect(auditLogQuerySchema.safeParse({ page: "0", limit: "101" }).success).toBe(false);
    });
});
