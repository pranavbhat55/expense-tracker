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

import { invitationPreviewController } from "../controllers/invitation.controller.js";

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

// Public: lets the sign-up page show which organization an invite link belongs to.
router.get("/invitations/:token", invitationPreviewController);

export default router;