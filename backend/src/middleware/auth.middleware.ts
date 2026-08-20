import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { jwtSecret } from "../config/env.js";

interface JwtPayload {
    userId: number;
    email: string;
}

export function authenticate(
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

        const decoded = jwt.verify(
            token,
            jwtSecret
        );

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            !("userId" in decoded) ||
            typeof decoded.userId !== "number"
        ) {
            throw new AppError("Invalid token", 401);
        }

        req.userId = decoded.userId;

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
            return;
        }

        next(new AppError("Invalid or expired token", 401));
    }
}