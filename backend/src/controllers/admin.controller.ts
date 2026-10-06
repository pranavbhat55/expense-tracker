import type { NextFunction, Request, Response } from "express";
import { getTenantDetail, listTenants, setTenantSubscriptionStatus } from "../services/admin.service.js";
import { AppError } from "../utils/AppError.js";

function tenantId(value: unknown) {
    if (typeof value !== "string") throw new AppError("Invalid tenant ID", 400, "INVALID_TENANT_ID");
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new AppError("Invalid tenant ID", 400, "INVALID_TENANT_ID");
    return id;
}

export async function listTenantsController(_req: Request, res: Response, next: NextFunction) {
    try { res.json(await listTenants()); } catch (error) { next(error); }
}

export async function getTenantDetailController(req: Request, res: Response, next: NextFunction) {
    try { res.json(await getTenantDetail(tenantId(req.params.tenantId))); } catch (error) { next(error); }
}

export async function updateTenantSubscriptionStatusController(req: Request, res: Response, next: NextFunction) {
    try {
        const result = await setTenantSubscriptionStatus(tenantId(req.params.tenantId), req.userId, req.body.status);
        res.json(result);
    } catch (error) { next(error); }
}
