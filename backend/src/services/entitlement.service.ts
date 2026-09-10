import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";

export type Feature = "timelineReports" | "csvExport" | "budgets";
type Plan = "FREE" | "PRO" | "BUSINESS";

const PLAN_ENTITLEMENTS: Record<Plan, {
    features: Record<Feature, boolean>;
    limits: { maxUsers: number | null; maxExpensesPerMonth: number | null };
}> = {
    FREE: { features: { timelineReports: false, csvExport: false, budgets: true }, limits: { maxUsers: 1, maxExpensesPerMonth: 100 } },
    PRO: { features: { timelineReports: true, csvExport: true, budgets: true }, limits: { maxUsers: 5, maxExpensesPerMonth: 1000 } },
    BUSINESS: { features: { timelineReports: true, csvExport: true, budgets: true }, limits: { maxUsers: null, maxExpensesPerMonth: null } },
};

export function getPlanEntitlements(plan: Plan) {
    return PLAN_ENTITLEMENTS[plan];
}

function monthRange(now = new Date()) {
    return {
        gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
}

export async function getTenantEntitlements(tenantId: number) {
    const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new AppError("No subscription found for this workspace", 403, "SUBSCRIPTION_REQUIRED");
    if (subscription.expiresAt <= new Date() && subscription.status !== "EXPIRED") {
        await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "EXPIRED" } });
        subscription.status = "EXPIRED";
    }
    const valid = subscription.status === "ACTIVE" || subscription.status === "TRIALING";
    const plan = subscription.plan as Plan;
    const base = getPlanEntitlements(plan);
    const [expensesThisMonth, users] = await Promise.all([
        prisma.expense.count({ where: { tenantId, date: monthRange() } }),
        prisma.user.count({ where: { tenantId } }),
    ]);
    return {
        subscription,
        entitlements: {
            features: Object.fromEntries(Object.entries(base.features).map(([key, value]) => [key, valid && value])) as Record<Feature, boolean>,
            limits: base.limits,
            usage: { expensesThisMonth, users },
        },
    };
}

export async function requireFeature(tenantId: number, feature: Feature) {
    const result = await getTenantEntitlements(tenantId);
    if (!result.entitlements.features[feature]) {
        throw new AppError(`${feature === "csvExport" ? "CSV export" : feature === "timelineReports" ? "Timeline reports" : "Budgets"} are not included in your current plan.`, 403, "FEATURE_NOT_ENTITLED");
    }
    return result;
}

export async function enforceExpenseQuota(tenantId: number) {
    const result = await getTenantEntitlements(tenantId);
    const limit = result.entitlements.limits.maxExpensesPerMonth;
    if (limit !== null && result.entitlements.usage.expensesThisMonth >= limit) {
        throw new AppError("Monthly expense limit reached.", 403, "EXPENSE_QUOTA_EXCEEDED");
    }
}

export async function enforceSeatLimit(tenantId: number) {
    const result = await getTenantEntitlements(tenantId);
    const limit = result.entitlements.limits.maxUsers;
    if (limit !== null && result.entitlements.usage.users >= limit) {
        throw new AppError("Workspace seat limit reached.", 403, "SEAT_LIMIT_EXCEEDED");
    }
}
