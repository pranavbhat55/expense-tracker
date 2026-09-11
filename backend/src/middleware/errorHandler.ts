import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    console.error(error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            ...(error.code ? { code: error.code } : {}),
        });
    }

    return res.status(500).json({
        message: "Internal server error",
    });
}
