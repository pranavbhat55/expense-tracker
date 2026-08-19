import { Router } from "express";
import {
    createExpenseController,
    deleteExpenseController,
    getExpenseByIdController,
    getExpensesController,
    updateExpenseController,
} from "../controllers/expense.controller.js";
import { validateBody } from "../middleware/validate.js";
import {
    createExpenseSchema,
    updateExpenseSchema,
} from "../middleware/expense.validation.js";

const router = Router();

router.post(
    "/",
    validateBody(createExpenseSchema),
    createExpenseController,
);

router.get("/", getExpensesController);

router.get("/:id", getExpenseByIdController);

router.put(
    "/:id",
    validateBody(updateExpenseSchema),
    updateExpenseController,
);

router.delete("/:id", deleteExpenseController);

export default router;