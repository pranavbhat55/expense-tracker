import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";

type GroupBy = "day" | "week" | "month";

function getDateKey(
    date: Date,
    groupBy: GroupBy,
): string {
    if (groupBy === "day") {
        return date.toISOString().slice(0, 10);
    }

    if (groupBy === "month") {
        return date.toISOString().slice(0, 7);
    }

    const year = date.getUTCFullYear();
    const firstDayOfYear = new Date(
        Date.UTC(year, 0, 1),
    );

    const dayOfYear =
        Math.floor(
            (date.getTime() -
                firstDayOfYear.getTime()) /
                86400000,
        ) + 1;

    const week = Math.ceil(dayOfYear / 7);

    return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function getTimelineReport(
    tenantId: number,
    from: Date,
    to: Date,
    groupBy: GroupBy,
) {
    if (from >= to) {
        throw new AppError(
            "The start date must be before the end date",
            400,
        );
    }

    const expenses = await prisma.expense.findMany({
        where: {
            tenantId,
            date: {
                gte: from,
                lt: to,
            },
        },
        select: {
            amount: true,
            date: true,
        },
        orderBy: {
            date: "asc",
        },
    });

    const timelineMap = new Map<
        string,
        { total: number; count: number }
    >();

    for (const expense of expenses) {
        const key = getDateKey(
            expense.date,
            groupBy,
        );

        const current = timelineMap.get(key) ?? {
            total: 0,
            count: 0,
        };

        current.total += Number(expense.amount);
        current.count += 1;

        timelineMap.set(key, current);
    }

    const timeline = Array.from(
        timelineMap.entries(),
        ([date, value]) => ({
            date,
            total: value.total,
            count: value.count,
        }),
    );

    const total = expenses.reduce(
        (sum, expense) =>
            sum + Number(expense.amount),
        0,
    );

    return {
        from,
        to,
        groupBy,
        total,
        count: expenses.length,
        timeline,
    };
}