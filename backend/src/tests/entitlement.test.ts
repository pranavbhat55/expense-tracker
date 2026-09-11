import { describe, expect, it } from "vitest";
import { getPlanEntitlements } from "../services/entitlement.service.js";

describe("plan entitlements", () => {
    it("enforces distinct free, pro, and business limits", () => {
        expect(getPlanEntitlements("FREE").limits).toEqual({ maxUsers: 1, maxExpensesPerMonth: 100 });
        expect(getPlanEntitlements("PRO").limits).toEqual({ maxUsers: 5, maxExpensesPerMonth: 1000 });
        expect(getPlanEntitlements("BUSINESS").limits).toEqual({ maxUsers: null, maxExpensesPerMonth: null });
    });

    it("only enables reporting and export on paid plans", () => {
        expect(getPlanEntitlements("FREE").features.timelineReports).toBe(false);
        expect(getPlanEntitlements("FREE").features.csvExport).toBe(false);
        expect(getPlanEntitlements("PRO").features.timelineReports).toBe(true);
        expect(getPlanEntitlements("BUSINESS").features.csvExport).toBe(true);
    });
});
