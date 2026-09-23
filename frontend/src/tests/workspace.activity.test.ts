import { describe, expect, it } from "vitest";
import { describeAuditLog } from "../App";
import type { AuditLog } from "../api/workspace";

function audit(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 1,
    action: "ROLE_CHANGED",
    entityType: "USER",
    entityId: "2",
    metadata: { previousRole: "MEMBER", newRole: "ADMIN" },
    createdAt: "2026-09-23T00:00:00.000Z",
    user: { id: 1, name: "Rahul", email: "rahul@example.com" },
    ...overrides,
  };
}

describe("workspace activity descriptions", () => {
  it("renders role changes in a human-readable form", () => {
    expect(describeAuditLog(audit())).toBe("Rahul changed a member role: MEMBER → ADMIN");
  });

  it("renders expense activity without sensitive data", () => {
    expect(describeAuditLog(audit({ action: "EXPENSE_CREATED", metadata: { amount: 2500, category: "Food" } }))).toBe("Rahul created an expense: ₹2,500 · Food");
  });
});
