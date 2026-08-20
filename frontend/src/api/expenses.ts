import type {
    ExpensesResponse,
    Expense,
} from "../types/expense";

const API_URL = "http://localhost:3000";

export async function getExpenses(): Promise<ExpensesResponse> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/expenses?page=1&limit=100`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Failed to fetch expenses");
    }

    return response.json();
}

export async function createExpense(
    amount: number,
    category: string,
    date: string,
    note: string,
): Promise<Expense> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/expenses`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                amount,
                category,
                date,
                note: note || undefined,
            }),
        },
    );

    if (!response.ok) {
        throw new Error("Failed to create expense");
    }

    return response.json();
}

export async function updateExpense(
    id: number,
    amount: number,
    category: string,
    date: string,
    note: string,
): Promise<Expense> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/expenses/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                amount,
                category,
                date,
                note: note || undefined,
            }),
        },
    );

    if (!response.ok) {
        throw new Error("Failed to update expense");
    }

    return response.json();
}

export async function deleteExpense(
    id: number,
): Promise<void> {
    const token = localStorage.getItem("token");

    const response = await fetch(
        `${API_URL}/expenses/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Failed to delete expense");
    }
}