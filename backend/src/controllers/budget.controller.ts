import type { Request, Response } from "express";
import {
    createBudget,
    deleteBudget,
    getBudgetById,
    getBudgets,
    updateBudget,
} from "../services/budget.service.js";
import { AppError } from "../utils/AppError.js";

export async function createBudgetController(
    req: Request,
    res: Response,
) {
    try {
        const { amount, category, month } = req.body;

        const budget = await createBudget(
            req.userId,
            req.tenantId,
            {
                amount,
                category,
                month,
            },
        );

        return res.status(201).json(budget);
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error("Failed to create budget:", error);

        return res.status(500).json({
            message: "Failed to create budget",
        });
    }
}

export async function getBudgetsController(
    req: Request,
    res: Response,
) {
    try {
        const month =
            typeof req.query.month === "string"
                ? req.query.month
                : undefined;

        const budgets = await getBudgets(
            req.userId,
            req.tenantId,
            month,
        );

        return res.status(200).json(budgets);
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error("Failed to fetch budgets:", error);

        return res.status(500).json({
            message: "Failed to fetch budgets",
        });
    }
}

export async function updateBudgetController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid budget ID",
            });
        }

        const existingBudget = await getBudgetById(
            id,
            req.userId,
            req.tenantId,
        );

        if (!existingBudget) {
            return res.status(404).json({
                message: "Budget not found",
            });
        }

        const { amount, category, month } = req.body;

        const budget = await updateBudget(
            id,
            req.userId,
            req.tenantId,
            {
                amount,
                category,
                month,
            },
        );

        return res.status(200).json(budget);
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error("Failed to update budget:", error);

        return res.status(500).json({
            message: "Failed to update budget",
        });
    }
}

export async function deleteBudgetController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid budget ID",
            });
        }

        const existingBudget = await getBudgetById(
            id,
            req.userId,
            req.tenantId,
        );

        if (!existingBudget) {
            return res.status(404).json({
                message: "Budget not found",
            });
        }

        await deleteBudget(
            id,
            req.userId,
            req.tenantId,
        );

        return res.status(204).send();
    } catch (error) {
        if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
        console.error("Failed to delete budget:", error);

        return res.status(500).json({
            message: "Failed to delete budget",
        });
    }
}
