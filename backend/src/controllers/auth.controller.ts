import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await registerUser(req.body);

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}
export async function loginController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const result = await loginUser(req.body);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}