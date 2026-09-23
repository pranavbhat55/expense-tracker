import crypto from "crypto";
import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./audit.service.js";

function generateLicenseKey(): string {
    return `EXP-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
}

function getExpiryDate(months: number): Date {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
}

export async function getSubscription(
    tenantId: number,
) {
    const subscription = await prisma.subscription.findUnique({
        where: {
            tenantId,
        },
    });

    if (!subscription) {
        return null;
    }

    if (
        subscription.status === "ACTIVE" &&
        subscription.expiresAt < new Date()
    ) {
        return prisma.subscription.update({
            where: {
                id: subscription.id,
            },
            data: {
                status: "EXPIRED",
            },
        });
    }

    return subscription;
}

export async function createSubscription(
    tenantId: number,
    actorId: number,
    plan: "FREE" | "PRO" | "BUSINESS",
) {
    const existingSubscription =
        await prisma.subscription.findUnique({
            where: {
                tenantId,
            },
        });

    if (existingSubscription) {
        throw new AppError(
            "Tenant already has a subscription",
            409,
        );
    }

    const months = plan === "FREE" ? 12 : 1;

    const subscription = await prisma.subscription.create({
        data: {
            tenantId,
            plan,
            status: "ACTIVE",
            licenseKey: generateLicenseKey(),
            startsAt: new Date(),
            expiresAt: getExpiryDate(months),
        },
    });
    await createAuditLog({ tenantId, userId: actorId, action: "SUBSCRIPTION_PLAN_CHANGED", entityType: "SUBSCRIPTION", entityId: subscription.id, metadata: { previousPlan: "NONE", newPlan: plan } });
    return subscription;
}

export async function changeSubscription(
    tenantId: number,
    actorId: number,
    plan: "FREE" | "PRO" | "BUSINESS",
) {
    const subscription = await prisma.subscription.findUnique({
        where: {
            tenantId,
        },
    });

    if (!subscription) {
        throw new AppError(
            "Subscription not found",
            404,
        );
    }

    const updated = await prisma.subscription.update({
        where: {
            id: subscription.id,
        },
        data: {
            plan,
            status: "ACTIVE",
            licenseKey: generateLicenseKey(),
            startsAt: new Date(),
            expiresAt: getExpiryDate(
                plan === "FREE" ? 12 : 1,
            ),
        },
    });
    await createAuditLog({ tenantId, userId: actorId, action: "SUBSCRIPTION_PLAN_CHANGED", entityType: "SUBSCRIPTION", entityId: updated.id, metadata: { previousPlan: subscription.plan, newPlan: plan } });
    return updated;
}
