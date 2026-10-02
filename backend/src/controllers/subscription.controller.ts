import type { Request, Response } from "express";
import {
    getSubscription,
    createSubscription,
    changeSubscription,
} from "../services/subscription.service.js";
import { getTenantEntitlements } from "../services/entitlement.service.js";
import { AppError } from "../utils/AppError.js";

function requireOwner(req: Request) {
    if (req.role !== "OWNER") throw new AppError("Only the workspace owner can manage the subscription", 403, "FORBIDDEN");
}

function validPlan(plan: unknown): plan is "FREE" | "PRO" | "BUSINESS" {
    return plan === "FREE" || plan === "PRO" || plan === "BUSINESS";
}

export async function getSubscriptionController(
    req: Request,
    res: Response,
) {
    try {
        const { subscription, entitlements } = await getTenantEntitlements(req.tenantId);
        if (req.baseUrl === "/subscription" && req.path === "/") return res.status(200).json(subscription);
        return res.status(200).json({ subscription, role: req.role, isSuperAdmin: req.isSuperAdmin, plan: subscription.plan, status: subscription.status, licenseKey: req.role === "OWNER" ? subscription.licenseKey : undefined, entitlements });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error(
            "Failed to fetch subscription:",
            error,
        );

        return res.status(500).json({
            message: "Failed to fetch subscription",
        });
    }
}

export async function createSubscriptionController(
    req: Request,
    res: Response,
) {
    try {
        requireOwner(req);
        const { plan } = req.body;

        if (!validPlan(plan)) {
            return res.status(400).json({
                message:
                    "Plan must be FREE, PRO, or BUSINESS",
            });
        }

        await createSubscription(
            req.tenantId,
            req.userId,
            plan,
        );

        const { subscription, entitlements } = await getTenantEntitlements(req.tenantId);
        return res.status(201).json({
            subscription,
            role: req.role,
            plan: subscription.plan,
            status: subscription.status,
            licenseKey: subscription.licenseKey,
            entitlements,
        });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error(
            "Failed to create subscription:",
            error,
        );

        if (
            error instanceof Error &&
            error.message ===
                "Tenant already has a subscription"
        ) {
            return res.status(409).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create subscription",
        });
    }
}

export async function changeSubscriptionController(
    req: Request,
    res: Response,
) {
    try {
        requireOwner(req);
        const { plan } = req.body;

        if (!validPlan(plan)) {
            return res.status(400).json({
                message:
                    "Plan must be FREE, PRO, or BUSINESS",
            });
        }

        await changeSubscription(
            req.tenantId,
            req.userId,
            plan,
        );

        const { subscription, entitlements } = await getTenantEntitlements(req.tenantId);
        return res.status(200).json({
            subscription,
            role: req.role,
            plan: subscription.plan,
            status: subscription.status,
            licenseKey: subscription.licenseKey,
            entitlements,
        });
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error(
            "Failed to change subscription:",
            error,
        );

        if (
            error instanceof Error &&
            error.message === "Subscription not found"
        ) {
            return res.status(404).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to change subscription",
        });
    }
}
