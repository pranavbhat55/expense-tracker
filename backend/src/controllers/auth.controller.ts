import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";
export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        await registerUser(req.body);
        const session = await loginUser({
            email: req.body.email,
            password: req.body.password,
        });

        // Registration signs the user in immediately so the frontend can use
        // protected workspace features, including expense creation.
        res.status(201).json(session);
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
