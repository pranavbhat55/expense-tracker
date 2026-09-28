import type { Request, Response, NextFunction } from "express";
import {
    createExpense,
    getExpenses,
    getExpenseSummary,
    getExpenseById,
    updateExpense,
    deleteExpense,
} from "../services/expense.service.js";
import { enforceExpenseQuota, requireFeature } from "../services/entitlement.service.js";

import { AppError } from "../utils/AppError.js";

// Members only ever see their own expenses. OWNER/ADMIN may opt into the organization-wide
// view with ?scope=team; the role comes from the DB re-check in authenticate, not the token.
function expenseOwner(req: Request): number | null {
    if (req.query.scope !== "team") return req.userId;
    if (req.role === "MEMBER") throw new AppError("Only owners and admins can view team expenses", 403, "FORBIDDEN");
    return null;
}

export async function createExpenseController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        await enforceExpenseQuota(req.tenantId);
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
    expenseOwner(req),
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
            expenseOwner(req),
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

export async function exportExpensesController(req: Request, res: Response, next: NextFunction) {
    try {
        await requireFeature(req.tenantId, "csvExport");
        const expenses = await getExpenses(req.userId, req.tenantId, { page: 1, limit: 100, ...(typeof req.query.month === "string" ? { month: req.query.month } : {}), ...(typeof req.query.category === "string" ? { category: req.query.category } : {}) });
        const escape = (value: string) => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        const csv = ["Date,Category,Note,Amount", ...expenses.data.map((expense) => [expense.date.toISOString().slice(0, 10), expense.category, expense.note ?? "", String(expense.amount)].map(escape).join(","))].join("\r\n");
        res.type("text/csv").attachment("expenses.csv").send(csv);
    } catch (error) { next(error); }
}
