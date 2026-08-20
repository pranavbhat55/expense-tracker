import { prisma } from "./prisma.js";

export async function createExpense(
    userId: number,
    data: {
        amount: number;
        category: string;
        date: Date;
        note?: string;
    },
) {
    return prisma.expense.create({
        data: {
            amount: data.amount,
            category: data.category,
            date: data.date,
            ...(data.note !== undefined && { note: data.note }),
            userId,
        },
    });
}

export async function getExpenses(
    userId: number,
    filters?: {
        month?: string;
        category?: string;
    },
) {
    const where: {
        userId: number;
        category?: string;
        date?: {
            gte: Date;
            lt: Date;
        };
    } = {
        userId,
    };

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

export async function getExpenseById(
    id: number,
    userId: number,
) {
    return prisma.expense.findFirst({
        where: {
            id,
            userId,
        },
    });
}

export async function updateExpense(
    id: number,
    userId: number,
    data: {
        amount: number;
        category: string;
        date: Date;
        note?: string;
    },
) {
    const existingExpense = await getExpenseById(id, userId);

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

export async function deleteExpense(
    id: number,
    userId: number,
) {
    const existingExpense = await getExpenseById(id, userId);

    if (!existingExpense) {
        return null;
    }

    return prisma.expense.delete({
        where: {
            id,
        },
    });
}