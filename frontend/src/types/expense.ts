export interface Expense {
    id: number;
    amount: string;
    category: string;
    date: string;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    userId: number;
}

export interface ExpensesResponse {
    data: Expense[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}