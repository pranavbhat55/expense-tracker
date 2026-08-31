import { describe, expect, it } from "vitest";
import {
    buildExpensesCsv,
    escapeCsvValue,
    formatExpenseDateForCsv,
} from "../App";
import type { Expense } from "../types/expense";

function makeExpense(
    overrides: Partial<Expense> = {},
): Expense {
    return {
        id: 1,
        amount: "12.50",
        category: "Food",
        date: "2026-08-05T00:00:00.000Z",
        note: "Lunch",
        createdAt: "2026-08-05T00:00:00.000Z",
        updatedAt: "2026-08-05T00:00:00.000Z",
        userId: 1,
        ...overrides,
    };
}

describe("escapeCsvValue", () => {
    it("leaves plain values untouched", () => {
        expect(escapeCsvValue("Food")).toBe("Food");
    });

    it("wraps values containing commas in quotes", () => {
        expect(
            escapeCsvValue("Groceries, snacks"),
        ).toBe('"Groceries, snacks"');
    });

    it("doubles embedded quotation marks and wraps the value", () => {
        expect(
            escapeCsvValue('Said "hello"'),
        ).toBe('"Said ""hello"""');
    });

    it("wraps values containing newlines in quotes", () => {
        expect(
            escapeCsvValue("Line one\nLine two"),
        ).toBe('"Line one\nLine two"');
    });
});

describe("formatExpenseDateForCsv", () => {
    it("formats an ISO date string as YYYY-MM-DD", () => {
        expect(
            formatExpenseDateForCsv(
                "2026-08-05T00:00:00.000Z",
            ),
        ).toBe("2026-08-05");
    });
});

describe("buildExpensesCsv", () => {
    it("includes the expected header row", () => {
        const csv = buildExpensesCsv([]);

        expect(csv).toBe(
            "Date,Category,Note,Amount",
        );
    });

    it("builds one row per expense with the correct columns", () => {
        const csv = buildExpensesCsv([
            makeExpense({
                date: "2026-08-05T00:00:00.000Z",
                category: "Food",
                note: "Lunch",
                amount: "12.5",
            }),
        ]);

        const [, row] = csv.split("\r\n");

        expect(row).toBe(
            "2026-08-05,Food,Lunch,12.50",
        );
    });

    it("escapes commas, quotes, and newlines in note/category fields", () => {
        const csv = buildExpensesCsv([
            makeExpense({
                category: "Food, Drinks",
                note: 'Team "lunch"\nwith clients',
                amount: "40",
            }),
        ]);

        const [, row] = csv.split("\r\n");

        expect(row).toBe(
            '2026-08-05,"Food, Drinks","Team ""lunch""\nwith clients",40.00',
        );
    });

    it("falls back to an empty note when note is null", () => {
        const csv = buildExpensesCsv([
            makeExpense({
                note: null,
                amount: "5",
            }),
        ]);

        const [, row] = csv.split("\r\n");

        expect(row).toBe(
            "2026-08-05,Food,,5.00",
        );
    });

    it("only includes rows for the expenses it is given", () => {
        const filtered = [
            makeExpense({
                id: 1,
                category: "Food",
            }),
        ];

        const csv = buildExpensesCsv(filtered);

        expect(csv.split("\r\n")).toHaveLength(2);
    });
});