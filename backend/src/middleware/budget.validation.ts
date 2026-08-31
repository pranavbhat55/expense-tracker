import { z } from "zod";

export const createBudgetSchema = z.object({
    amount: z.number().positive(
        "Budget amount must be greater than 0",
    ),

    category: z
        .string({
            error: "Category is required",
        })
        .trim()
        .min(1, "Category is required"),

    month: z
        .string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])$/,
            "Month must be in YYYY-MM format",
        ),
});

export const updateBudgetSchema =
    createBudgetSchema;

export const budgetQuerySchema = z.object({
    month: z
        .string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])$/,
            "Month must be in YYYY-MM format",
        )
        .optional(),
});