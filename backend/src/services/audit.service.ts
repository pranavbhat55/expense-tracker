import { prisma } from "./prisma.js";

export type AuditAction =
    | "MEMBER_JOINED"
    | "ROLE_CHANGED"
    | "MEMBER_REMOVED"
    | "EXPENSE_CREATED"
    | "EXPENSE_UPDATED"
    | "EXPENSE_DELETED"
    | "BUDGET_CREATED"
    | "BUDGET_UPDATED"
    | "BUDGET_DELETED"
    | "SUBSCRIPTION_PLAN_CHANGED";

export async function createAuditLog(data: {
    tenantId: number;
    userId?: number | null;
    action: AuditAction;
    entityType: string;
    entityId: string | number;
    metadata?: Record<string, string | number | boolean | null>;
}) {
    return prisma.auditLog.create({
        data: {
            tenantId: data.tenantId,
            userId: data.userId ?? null,
            action: data.action,
            entityType: data.entityType,
            entityId: String(data.entityId),
            ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
        },
    });
}

export async function getAuditLogs(
    tenantId: number,
    filters: { page: number; limit: number; action?: string; entityType?: string },
) {
    const where = {
        tenantId,
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
    };
    const [data, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (filters.page - 1) * filters.limit,
            take: filters.limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return {
        data,
        pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages: Math.ceil(total / filters.limit),
        },
    };
}
