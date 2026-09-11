import { Router } from "express";
import {
    createBudgetController,
    deleteBudgetController,
    getBudgetsController,
    updateBudgetController,
} from "../controllers/budget.controller.js";
import {
    createBudgetSchema,
    budgetQuerySchema,
    updateBudgetSchema,
} from "../middleware/budget.validation.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
    "/",
    validateBody(createBudgetSchema),
    createBudgetController,
);

router.get(
    "/",
    validateQuery(budgetQuerySchema),
    getBudgetsController,
);

router.put(
    "/:id",
    validateBody(updateBudgetSchema),
    updateBudgetController,
);

router.delete(
    "/:id",
    deleteBudgetController,
);

export default router;