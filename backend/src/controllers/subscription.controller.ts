import type { Request, Response } from "express";
import {
    getSubscription,
    createSubscription,
    changeSubscription,
} from "../services/subscription.service.js";

export async function getSubscriptionController(
    req: Request,
    res: Response,
) {
    try {
        const subscription = await getSubscription(
            req.tenantId,
        );

        if (!subscription) {
            return res.status(404).json({
                message: "No subscription found",
            });
        }

        return res.status(200).json(subscription);
    } catch (error) {
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
        const { plan } = req.body;

        if (
            plan !== "FREE" &&
            plan !== "PRO" &&
            plan !== "BUSINESS"
        ) {
            return res.status(400).json({
                message:
                    "Plan must be FREE, PRO, or BUSINESS",
            });
        }

        const subscription = await createSubscription(
            req.tenantId,
            plan,
        );

        return res.status(201).json(subscription);
    } catch (error) {
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
        const { plan } = req.body;

        if (
            plan !== "FREE" &&
            plan !== "PRO" &&
            plan !== "BUSINESS"
        ) {
            return res.status(400).json({
                message:
                    "Plan must be FREE, PRO, or BUSINESS",
            });
        }

        const subscription = await changeSubscription(
            req.tenantId,
            plan,
        );

        return res.status(200).json(subscription);
    } catch (error) {
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