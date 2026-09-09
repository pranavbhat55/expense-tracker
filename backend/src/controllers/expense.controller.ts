import type { Request, Response, NextFunction } from "express";
import {
    createExpense,
    getExpenses,
    getExpenseSummary,
    getExpenseById,
    updateExpense,
    deleteExpense,
} from "../services/expense.service.js";

export async function createExpenseController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const expense = await createExpense(
            req.userId,
            req.tenantId,
            {
                amount: req.body.amount,
                category: req.body.category,
                date: new Date(req.body.date),
                note: req.body.note,
            },
        );

        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
}

export async function getExpensesController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
	const expenses = await getExpenses(
    req.userId,
    req.tenantId,
    {
        ...(typeof req.query.month === "string"
            ? { month: req.query.month }
            : {}),
        ...(typeof req.query.category === "string"
            ? { category: req.query.category }
            : {}),
        page,
        limit,
    },
);
        
        res.status(200).json(expenses);
    } catch (error) {
        next(error);
    }
}

export async function getExpenseSummaryController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const month =
            typeof req.query.month === "string"
                ? req.query.month
                : undefined;

        const summary = await getExpenseSummary(
            req.userId,
            req.tenantId,
            month,
        );

        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
}

export async function getExpenseByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = Number(req.params.id);

        const expense = await getExpenseById(
            id,
            req.userId,
            req.tenantId,
        );

        if (!expense) {
            res.status(404).json({
                message: "Expense not found",
            });
            return;
        }

        res.status(200).json(expense);
    } catch (error) {
        next(error);
    }
}

export async function updateExpenseController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = Number(req.params.id);

        const existingExpense = await getExpenseById(
            id,
            req.userId,
            req.tenantId,
        );

        if (!existingExpense) {
            res.status(404).json({
                message: "Expense not found",
            });
            return;
        }

        const expense = await updateExpense(
            id,
            req.userId,
            req.tenantId,
            {
                amount: req.body.amount,
                category: req.body.category,
                date: new Date(req.body.date),
                note: req.body.note,
            },
        );

        res.status(200).json(expense);
    } catch (error) {
        next(error);
    }
}

export async function deleteExpenseController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const id = Number(req.params.id);

        const existingExpense = await getExpenseById(
            id,
            req.userId,
            req.tenantId,
        );

        if (!existingExpense) {
            res.status(404).json({
                message: "Expense not found",
            });
            return;
        }

        await deleteExpense(
            id,
            req.userId,
            req.tenantId,
        );

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}