import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function requireRole(...roles: Array<"OWNER" | "ADMIN" | "MEMBER">) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!roles.includes(req.role)) return next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
        next();
    };
}

// Platform-level gate, orthogonal to per-tenant OWNER/ADMIN/MEMBER roles.
// A super-admin may have any tenant role (or none relevant) - this only
// guards the cross-tenant /admin API surface, never tenant-scoped routes.
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
    if (!req.isSuperAdmin) return next(new AppError("Super-admin access required", 403, "FORBIDDEN"));
    next();
}
