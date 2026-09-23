import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { jwtSecret } from "../config/env.js";
import { prisma } from "../services/prisma.js";

interface JwtPayload {
    userId: number;
    email: string;
    tenantId: number;
    role: "OWNER" | "ADMIN" | "MEMBER";
}

export async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            throw new AppError("Authentication required", 401);
        }

        const token = authorization.slice(7);

        if (!token) {
            throw new AppError("Authentication required", 401);
        }

        const decoded = jwt.verify(token, jwtSecret);

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            !("userId" in decoded) ||
            typeof decoded.userId !== "number" ||
            !("tenantId" in decoded) ||
            typeof decoded.tenantId !== "number" ||
            !("role" in decoded) ||
            (decoded.role !== "OWNER" && decoded.role !== "ADMIN" && decoded.role !== "MEMBER")
        ) {
            throw new AppError("Invalid token", 401);
        }

        const payload = decoded as JwtPayload;

        // The token supplies the tenant context, while the database confirms
        // that the subject remains a member and that its current role is used.
        // This immediately revokes access after removal and prevents stale role
        // claims from retaining owner permissions.
        const member = await prisma.user.findFirst({
            where: { id: payload.userId, tenantId: payload.tenantId },
            select: { role: true },
        });
        if (!member) throw new AppError("Workspace membership is no longer active", 401);

        req.userId = payload.userId;
        req.tenantId = payload.tenantId;
        req.role = member.role;

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
            return;
        }

        next(new AppError("Invalid or expired token", 401));
    }
}
