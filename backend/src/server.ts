import express from "express";
import cors from "cors";
import budgetRoutes from "./routes/budget.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
    }),
);

const PORT = 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/expenses", expenseRoutes);
app.use("/budgets", budgetRoutes);

app.use("/auth", authRoutes);

app.get("/test-error", () => {
    throw new Error("Test error");
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`,
        );
    });
}