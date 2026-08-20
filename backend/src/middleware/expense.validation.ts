import { z } from "zod";

const today = new Date();
today.setHours(23, 59, 59, 999);

export const createExpenseSchema = z.object({
    amount: z.number().positive(
        "Amount must be greater than 0",
    ),

    category: z
        .string({
            error: "Category is required",
        })
        .trim()
        .min(1, "Category is required"),

    date: z
        .coerce
        .date({
            error: "Date must be a valid date",
        })
        .max(today, "Date cannot be in the future"),

    note: z.string().trim().optional(),
});

export const updateExpenseSchema =
    createExpenseSchema;

export const expenseQuerySchema = z.object({
    month: z
        .string()
        .regex(
            /^\d{4}-(0[1-9]|1[0-2])$/,
            "Month must be in YYYY-MM format",
        )
        .optional(),

    category: z
        .string()
        .trim()
        .min(1, "Category cannot be empty")
        .optional(),

    page: z
        .string()
        .regex(
            /^\d+$/,
            "Page must be a positive integer",
        )
        .transform(Number)
        .refine(
            (value) => value > 0,
            "Page must be greater than 0",
        )
        .optional()
        .default(1),

    limit: z
        .string()
        .regex(
            /^\d+$/,
            "Limit must be a positive integer",
        )
        .transform(Number)
        .refine(
            (value) =>
                value > 0 && value <= 100,
            "Limit must be between 1 and 100",
        )
        .optional()
        .default(10),
});