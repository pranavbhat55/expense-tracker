import { Router } from "express";
import {
    createExpenseController,
    deleteExpenseController,
    getExpenseByIdController,
    getExpensesController,
    getExpenseSummaryController,
    updateExpenseController,
} from "../controllers/expense.controller.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
    createExpenseSchema,
    expenseQuerySchema,
    updateExpenseSchema,
} from "../middleware/expense.validation.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);

router.post(
    "/",
    validateBody(createExpenseSchema),
    createExpenseController,
);

router.get(
    "/",
    validateQuery(expenseQuerySchema),
    getExpensesController,
);
router.get(
    "/summary",
    getExpenseSummaryController,
);

router.get("/:id", getExpenseByIdController);

router.put(
    "/:id",
    validateBody(updateExpenseSchema),
    updateExpenseController,
);

router.delete("/:id", deleteExpenseController);

export default router;