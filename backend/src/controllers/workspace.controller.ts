import type { NextFunction, Request, Response } from "express";
import { getAuditLogs } from "../services/audit.service.js";
import { changeMemberRole, getMembers, removeMember } from "../services/workspace.service.js";
import { AppError } from "../utils/AppError.js";

function memberId(value: unknown) {
    if (typeof value !== "string") throw new AppError("Invalid member ID", 400, "INVALID_MEMBER_ID");
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new AppError("Invalid member ID", 400, "INVALID_MEMBER_ID");
    return id;
}

export async function getMembersController(req: Request, res: Response, next: NextFunction) {
    try { res.json(await getMembers(req.tenantId)); } catch (error) { next(error); }
}

export async function changeMemberRoleController(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await changeMemberRole(req.tenantId, req.userId, memberId(req.params.userId), req.body.role);
        res.json(result.member);
    } catch (error) { next(error); }
}

export async function removeMemberController(req: Request, res: Response, next: NextFunction) {
    try {
        await removeMember(req.tenantId, req.userId, memberId(req.params.userId));
        res.status(204).send();
    } catch (error) { next(error); }
}

export async function getAuditLogsController(req: Request, res: Response, next: NextFunction) {
    try {
        res.json(await getAuditLogs(req.tenantId, {
            page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20),
            ...(typeof req.query.action === "string" ? { action: req.query.action } : {}),
            ...(typeof req.query.entityType === "string" ? { entityType: req.query.entityType } : {}),
        }));
    } catch (error) { next(error); }
}
