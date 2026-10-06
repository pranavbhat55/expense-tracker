export interface Expense {
    id: number;
    amount: string;
    category: string;
    date: string;
    note: string | null;
    createdAt: string;
    updatedAt: string;
    userId: number;
    /** Present only in the owner/admin team view. */
    user?: { id: number; name: string };
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
export interface CategorySummary {
    category: string;
    total: number;
}

export interface ExpenseSummary {
    total: number;
    count: number;
    average: number;
    highest: number;
    byCategory: CategorySummary[];
}
export interface CategorySummary {
    category: string;
    total: number;
}

export interface ExpenseSummary {
    total: number;
    count: number;
    average: number;
    highest: number;
    byCategory: CategorySummary[];
}