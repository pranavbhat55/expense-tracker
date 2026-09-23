import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function requireRole(...roles: Array<"OWNER" | "ADMIN" | "MEMBER">) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!roles.includes(req.role)) return next(new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"));
        next();
    };
}
