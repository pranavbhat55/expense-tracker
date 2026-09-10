import { prisma } from "./prisma.js";
import { requireFeature } from "./entitlement.service.js";

export async function createBudget(
    userId: number,
    tenantId: number,
    data: {
        amount: number;
        category: string;
        month: string;
    },
) {
    await requireFeature(tenantId, "budgets");
    return prisma.budget.create({
        data: {
            amount: data.amount,
            category: data.category,
            month: data.month,
            userId,
            tenantId,
        },
    });
}

export async function getBudgets(
    userId: number,
    tenantId: number,
    month?: string,
) {
    await requireFeature(tenantId, "budgets");
    return prisma.budget.findMany({
        where: {
            userId,
            tenantId,
            ...(month ? { month } : {}),
        },
        orderBy: {
            category: "asc",
        },
    });
}

export async function getBudgetById(
    id: number,
    userId: number,
    tenantId: number,
) {
    await requireFeature(tenantId, "budgets");
    return prisma.budget.findFirst({
        where: {
            id,
            userId,
            tenantId,
        },
    });
}

export async function updateBudget(
    id: number,
    userId: number,
    tenantId: number,
    data: {
        amount: number;
        category: string;
        month: string;
    },
) {
    await requireFeature(tenantId, "budgets");
    const existingBudget = await getBudgetById(
        id,
        userId,
        tenantId,
    );

    if (!existingBudget) {
        return null;
    }

    return prisma.budget.update({
        where: {
            id,
        },
        data: {
            amount: data.amount,
            category: data.category,
            month: data.month,
        },
    });
}

export async function deleteBudget(
    id: number,
    userId: number,
    tenantId: number,
) {
    const existingBudget = await getBudgetById(
        id,
        userId,
        tenantId,
    );

    if (!existingBudget) {
        return null;
    }

    return prisma.budget.delete({
        where: {
            id,
        },
    });
}
