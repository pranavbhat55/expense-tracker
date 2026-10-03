import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./audit.service.js";

export async function listTenants() {
    const tenants = await prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            subscription: true,
            _count: { select: { users: true, expenses: true } },
        },
    });

    return tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        createdAt: t.createdAt,
        memberCount: t._count.users,
        expenseCount: t._count.expenses,
        subscription: t.subscription
            ? { plan: t.subscription.plan, status: t.subscription.status, expiresAt: t.subscription.expiresAt }
            : null,
    }));
}

export async function getTenantDetail(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            subscription: true,
            users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        },
    });
    if (!tenant) throw new AppError("Tenant not found", 404);
    return tenant;
}

// Platform-level suspend/reactivate, distinct from a tenant OWNER's own
// plan-change flow (subscription.service.ts::createSubscription /
// changePlan). This bypasses tenant scoping entirely - only reachable via
// requireSuperAdmin-gated routes.
export async function setTenantSubscriptionStatus(
    tenantId: number,
    actorId: number,
    status: "ACTIVE" | "CANCELLED",
) {
    const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new AppError("Tenant has no subscription to update", 404);

    const updated = await prisma.subscription.update({
        where: { tenantId },
        data: { status },
    });

    // userId is intentionally left null: the acting super-admin belongs to a
    // different tenant, and AuditLog.userId's FK is scoped to this tenant's
    // membership elsewhere in the app. The admin's identity is preserved in
    // metadata instead, so tenant data stays strictly isolated.
    await createAuditLog({
        tenantId,
        userId: null,
        action: "SUBSCRIPTION_PLAN_CHANGED",
        entityType: "SUBSCRIPTION",
        entityId: subscription.id,
        metadata: { previousStatus: subscription.status, newStatus: status, source: "PLATFORM_ADMIN", actingSuperAdminId: actorId },
    });

    return updated;
}
