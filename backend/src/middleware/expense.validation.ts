import { z } from "zod";

export const createExpenseSchema = z.object({
    amount: z.number().positive("Amount must be greater than 0"),
    category: z.string().trim().min(1, "Category is required"),
    date: z.coerce.date({
        error: "Date must be a valid date",
    }),
    note: z.string().trim().optional(),
});

export const updateExpenseSchema = createExpenseSchema;