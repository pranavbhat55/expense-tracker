import express from "express";
import expenseRoutes from "./routes/expense.routes.js";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/expenses", expenseRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});