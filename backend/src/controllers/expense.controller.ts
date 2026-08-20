import type { Request, Response } from "express";
import {
    createExpense,
    deleteExpense,
    getExpenseById,
    getExpenses,
    updateExpense,
} from "../services/expense.service.js";
export async function createExpenseController(
    req: Request,
    res: Response,
) {
    try {
        const { amount, category, date, note } = req.body;

        const expense = await createExpense(req.userId, {
            amount,
            category,
            date,
            note,
        });
        return res.status(201).json(expense);
    } catch (error) {
        console.error("Failed to create expense:", error);

        return res.status(500).json({
            message: "Failed to create expense",
        });
    }
}

export async function getExpensesController(
    req: Request,
    res: Response,
) {
    try {
        const month =
            typeof req.query.month === "string"
                ? req.query.month
                : undefined;

        const category =
            typeof req.query.category === "string"
                ? req.query.category
                : undefined;

        const page =
            typeof req.query.page === "string"
                ? Number(req.query.page)
                : 1;

        const limit =
            typeof req.query.limit === "string"
                ? Number(req.query.limit)
                : 10;

        const filters: {
            month?: string;
            category?: string;
            page: number;
            limit: number;
        } = {
            page,
            limit,
        };

        if (month !== undefined) {
            filters.month = month;
        }

        if (category !== undefined) {
            filters.category = category;
        }

        const expenses = await getExpenses(
            req.userId,
            filters,
        );

        return res.status(200).json(expenses);
    } catch (error) {
        console.error("Failed to fetch expenses:", error);

        if (
            error instanceof Error &&
            error.message.startsWith("Invalid month format")
        ) {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to fetch expenses",
        });
    }
}
export async function getExpenseByIdController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid expense ID",
            });
        }

        const expense = await getExpenseById(id, req.userId);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        return res.status(200).json(expense);
    } catch (error) {
        console.error("Failed to fetch expense:", error);

        return res.status(500).json({
            message: "Failed to fetch expense",
        });
    }
}
export async function updateExpenseController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid expense ID",
            });
        }

        const { amount, category, date, note } = req.body;

        const existingExpense = await getExpenseById(
            id,
            req.userId,
        );
        if (!existingExpense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        const expense = await updateExpense(id, req.userId, {
            amount,
            category,
            date,
            note,
        });

        return res.status(200).json(expense);
    } catch (error) {
        console.error("Failed to update expense:", error);

        return res.status(500).json({
            message: "Failed to update expense",
        });
    }
}
export async function deleteExpenseController(
    req: Request,
    res: Response,
) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid expense ID",
            });
        }

        const existingExpense = await getExpenseById(
            id,
            req.userId,
        );
        if (!existingExpense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        await deleteExpense(id, req.userId);

        return res.status(204).send();
    } catch (error) {
        console.error("Failed to delete expense:", error);

        return res.status(500).json({
            message: "Failed to delete expense",
        });
    }
}