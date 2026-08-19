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
        const [yearString, monthString] = filters.month.split("-");

        const year = Number(yearString);
        const month = Number(monthString);

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