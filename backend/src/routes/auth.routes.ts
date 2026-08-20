import { Router } from "express";

import {
    registerController,
    loginController,
} from "../controllers/auth.controller.js";

import {
    registerSchema,
    loginSchema,
} from "../middleware/auth.validation.js";

import { validateBody } from "../middleware/validate.js";

const router = Router();

router.post(
    "/register",
    validateBody(registerSchema),
    registerController,
);

router.post(
    "/login",
    validateBody(loginSchema),
    loginController,
);

export default router;