import { prisma } from "./prisma.js";
import { AppError } from "../utils/AppError.js";
import { createAuditLog } from "./audit.service.js";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export async function getMembers(tenantId: number) {
    return prisma.user.findMany({
        where: { tenantId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
}

export async function changeMemberRole(tenantId: number, actorId: number, userId: number, role: WorkspaceRole) {
    const member = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!member) throw new AppError("Workspace member not found", 404, "MEMBER_NOT_FOUND");

    if (member.role === "OWNER" && role !== "OWNER") {
        const ownerCount = await prisma.user.count({ where: { tenantId, role: "OWNER" } });
        if (ownerCount <= 1) throw new AppError("A workspace must retain at least one owner", 409, "LAST_OWNER");
    }

    const updated = await prisma.user.update({
        where: { id: member.id },
        data: { role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await createAuditLog({
        tenantId, userId: actorId, action: "ROLE_CHANGED", entityType: "USER", entityId: updated.id,
        metadata: { previousRole: member.role, newRole: updated.role, memberEmail: updated.email },
    });
    return { previousRole: member.role, member: updated };
}

export async function removeMember(tenantId: number, actorId: number, userId: number) {
    const member = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!member) throw new AppError("Workspace member not found", 404, "MEMBER_NOT_FOUND");

    if (actorId === member.id) {
        throw new AppError("Owner cannot remove themselves from the workspace", 409, "SELF_REMOVAL_NOT_ALLOWED");
    }

    if (member.role === "OWNER") {
        const ownerCount = await prisma.user.count({ where: { tenantId, role: "OWNER" } });
        if (ownerCount <= 1) throw new AppError("Cannot remove the last workspace owner", 409, "LAST_OWNER");
    }

    try {
        await prisma.user.delete({ where: { id: member.id } });
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
            throw new AppError("Cannot remove a member who owns workspace records", 409, "MEMBER_HAS_RECORDS");
        }
        throw error;
    }
    const removed = { id: member.id, name: member.name, email: member.email, role: member.role };
    await createAuditLog({
        tenantId, userId: actorId, action: "MEMBER_REMOVED", entityType: "USER", entityId: removed.id,
        metadata: { memberEmail: removed.email, removedRole: removed.role },
    });
    return removed;
}
