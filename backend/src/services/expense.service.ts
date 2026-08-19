import { prisma } from "./prisma.js";

export async function createExpense(data: {
    amount: number;
    category: string;
    date: Date;
    note?: string;
}) {
    return prisma.expense.create({
        data: {
            amount: data.amount,
            category: data.category,
            date: data.date,
            ...(data.note !== undefined && { note: data.note }),
        },
    });
}

export async function getExpenses(filters?: {
    month?: string;
    category?: string;
}) {
    const where: {
        category?: string;
        date?: {
            gte: Date;
            lt: Date;
        };
    } = {};

    if (filters?.category) {
        where.category = filters.category;
    }

    if (filters?.month) {
        const parts = filters.month.split("-");

        if (parts.length !== 2) {
            throw new Error("Invalid month format. Use YYYY-MM.");
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);

        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            throw new Error("Invalid month format. Use YYYY-MM.");
        }

        where.date = {
            gte: new Date(Date.UTC(year, month - 1, 1)),
            lt: new Date(Date.UTC(year, month, 1)),
        };
    }

    return prisma.expense.findMany({
        where,
        orderBy: [
            { date: "desc" },
            { createdAt: "desc" },
        ],
    });
}

export async function getExpenseById(id: number) {
    return prisma.expense.findUnique({
        where: {
            id,
        },
    });
}

export async function updateExpense(
    id: number,
    data: {
        amount: number;
        category: string;
        date: Date;
        note?: string;
    },
) {
    const existingExpense = await prisma.expense.findUnique({
        where: { id },
    });

    if (!existingExpense) {
        return null;
    }

    return prisma.expense.update({
        where: {
            id,
        },
        data: {
            amount: data.amount,
            category: data.category,
            date: data.date,
            ...(data.note !== undefined && { note: data.note }),
        },
    });
}

export async function deleteExpense(id: number) {
    const existingExpense = await prisma.expense.findUnique({
        where: { id },
    });

    if (!existingExpense) {
        return null;
    }

    return prisma.expense.delete({
        where: {
            id,
        },
    });
}