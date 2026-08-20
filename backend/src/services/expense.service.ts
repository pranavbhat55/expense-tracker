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
            ...(data.note !== undefined && {
                note: data.note,
            }),
            userId,
        },
    });
}

export async function getExpenses(
    userId: number,
    filters: {
        month?: string;
        category?: string;
        page: number;
        limit: number;
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

    if (filters.category) {
        where.category = filters.category;
    }

    if (filters.month) {
        const [yearString, monthString] =
            filters.month.split("-");

        const year = Number(yearString);
        const month = Number(monthString);

        where.date = {
            gte: new Date(Date.UTC(year, month - 1, 1)),
            lt: new Date(Date.UTC(year, month, 1)),
        };
    }

    const skip =
        (filters.page - 1) * filters.limit;

    const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
            where,
            orderBy: [
                { date: "desc" },
                { createdAt: "desc" },
            ],
            skip,
            take: filters.limit,
        }),
        prisma.expense.count({
            where,
        }),
    ]);

    return {
        data: expenses,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(
                total / filters.limit,
            ),
        },
    };
}
export async function getExpenseSummary(
    userId: number,
    month?: string,
) {
    const where: {
        userId: number;
        date?: {
            gte: Date;
            lt: Date;
        };
    } = {
        userId,
    };

    if (month) {
        const [yearString, monthString] =
            month.split("-");

        const year = Number(yearString);
        const monthNumber = Number(monthString);

        where.date = {
            gte: new Date(
                Date.UTC(year, monthNumber - 1, 1),
            ),
            lt: new Date(
                Date.UTC(year, monthNumber, 1),
            ),
        };
    }

    const [expenses, count] = await Promise.all([
        prisma.expense.findMany({
            where,
            select: {
                amount: true,
                category: true,
            },
        }),
        prisma.expense.count({
            where,
        }),
    ]);

    const total = expenses.reduce(
        (sum, expense) =>
            sum + Number(expense.amount),
        0,
    );

    const categoryMap = new Map<string, number>();

    for (const expense of expenses) {
        const currentTotal =
            categoryMap.get(expense.category) ?? 0;

        categoryMap.set(
            expense.category,
            currentTotal + Number(expense.amount),
        );
    }

    const byCategory = Array.from(
        categoryMap,
        ([category, total]) => ({
            category,
            total,
        }),
    );

    return {
        total,
        count,
        byCategory,
    };
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
    const existingExpense = await getExpenseById(
        id,
        userId,
    );

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
            ...(data.note !== undefined && {
                note: data.note,
            }),
        },
    });
}

export async function deleteExpense(
    id: number,
    userId: number,
) {
    const existingExpense = await getExpenseById(
        id,
        userId,
    );

    if (!existingExpense) {
        return null;
    }

    return prisma.expense.delete({
        where: {
            id,
        },
    });
}