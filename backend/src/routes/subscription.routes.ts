import { Router } from "express";
import {
    getSubscriptionController,
    createSubscriptionController,
    changeSubscriptionController,
} from "../controllers/subscription.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getSubscriptionController);

router.post("/", createSubscriptionController);

router.put("/", changeSubscriptionController);

export default router;