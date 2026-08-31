import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  login,
  register,
} from "./api/auth";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  type Budget,
} from "./api/expenses";

import type {
  Expense,
  ExpenseSummary,
} from "./types/expense";

import "./App.css";

const CSV_COLUMNS = [
  "Date",
  "Category",
  "Note",
  "Amount",
];

function getTodayInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function escapeCsvValue(
  value: string,
): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function formatExpenseDateForCsv(
  date: string,
): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

export function buildExpensesCsv(
  rows: Expense[],
): string {
  const lines = [
    CSV_COLUMNS.join(","),
  ];

  for (const expense of rows) {
    const values = [
      formatExpenseDateForCsv(expense.date),
      expense.category,
      expense.note || "",
      Number(expense.amount).toFixed(2),
    ];

    lines.push(
      values.map(escapeCsvValue).join(","),
    );
  }

  return lines.join("\r\n");
}

function App() {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const observerRef =
    useRef<IntersectionObserver | null>(null);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [summary, setSummary] =
    useState<ExpenseSummary | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const [filterMonth, setFilterMonth] =
    useState("");
  const [filterCategory, setFilterCategory] =
    useState("");

  const [editingExpenseId, setEditingExpenseId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [name, setName] = useState("");

  const [isRegistering, setIsRegistering] =
    useState(false);

  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [budgetAmount, setBudgetAmount] =
    useState("");

  const [budgetCategory, setBudgetCategory] =
    useState("");

  const [budgetMonth, setBudgetMonth] =
    useState("");

  const [editingBudgetId, setEditingBudgetId] =
    useState<number | null>(null);

  const [budgetLoading, setBudgetLoading] =
    useState(false);

  async function loadBudgets() {
    try {
      const response = await getBudgets(
        filterMonth || undefined,
      );

      setBudgets(response);
    } catch (error) {
      console.error(error);
      setError(
        "Failed to load budgets",
      );
    }
  }

  async function loadSummary() {
    try {
      const response =
        await getExpenseSummary(
          filterMonth || undefined,
        );

      setSummary(response);
    } catch (error) {
      console.error(error);
      setError(
        "Failed to load expense summary",
      );
    }
  }

  async function loadExpenses(
    pageToLoad: number = 1,
  ) {
    if (pageToLoad === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    setError("");

    try {
      const response = await getExpenses(
        filterMonth || undefined,
        filterCategory || undefined,
        pageToLoad,
        10,
      );

      if (pageToLoad === 1) {
        setExpenses(response.data);
      } else {
        setExpenses((current) => [
          ...current,
          ...response.data,
        ]);
      }

      setPage(pageToLoad);

      setHasMore(
        pageToLoad <
        response.pagination.totalPages,
      );
    } catch (error) {
      console.error(error);

      setError(
        pageToLoad === 1
          ? "Failed to load expenses"
          : "Failed to load more expenses",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setCheckingAuth(false);
    }
  }

  const lastExpenseRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore || !hasMore) {
        return;
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current =
        new IntersectionObserver(
          (entries) => {
            if (
              entries[0].isIntersecting &&
              !loadingMore &&
              hasMore
            ) {
              loadExpenses(page + 1);
            }
          },
          {
            threshold: 0.1,
          },
        );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [loadingMore, hasMore, page],
  );

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    setExpenses([]);
    setPage(1);
    setHasMore(true);

    loadExpenses(1);
    loadSummary();
    loadBudgets();
  }, [filterMonth, filterCategory]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await login(
        email,
        password,
      );

      localStorage.setItem(
        "token",
        response.token,
      );

      setCheckingAuth(false);

      await loadExpenses();
      await loadSummary();
      await loadBudgets();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await register(
        name,
        email,
        password,
      );

      localStorage.setItem(
        "token",
        response.token,
      );

      setCheckingAuth(false);

      await loadExpenses();
      await loadSummary();
      await loadBudgets();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to create account",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExpenseSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const today = getTodayInputValue();

    if (!date) {
      setError("Please select an expense date.");
      setLoading(false);
      return;
    }

    if (date > today) {
      setError("Date cannot be in the future.");
      setLoading(false);
      return;
    }

    try {
      if (editingExpenseId !== null) {
        await updateExpense(
          editingExpenseId,
          Number(amount),
          category,
          date,
          note,
        );
      } else {
        await createExpense(
          Number(amount),
          category,
          date,
          note,
        );
      }

      setAmount("");
      setCategory("");
      setDate("");
      setNote("");
      setEditingExpenseId(null);

      await loadExpenses(1);
      await loadSummary();
      await loadBudgets();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to save expense",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEditExpense(
    expense: Expense,
  ) {
    setEditingExpenseId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);

    setDate(
      new Date(expense.date)
        .toISOString()
        .split("T")[0],
    );

    setNote(expense.note || "");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);
    setAmount("");
    setCategory("");
    setDate("");
    setNote("");
  }

  async function handleDeleteExpense(
    id: number,
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteExpense(id);

      if (editingExpenseId === id) {
        handleCancelEdit();
      }

      await loadExpenses(1);
      await loadSummary();
      await loadBudgets();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Failed to delete expense",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (expenses.length === 0) {
      return;
    }

    const csv =
      buildExpensesCsv(expenses);

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "expenses.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    localStorage.removeItem("token");

    setExpenses([]);
    setSummary(null);
    setBudgets([]);

    setEmail("");
    setPassword("");
    setError("");

    setCheckingAuth(false);
  }

  if (checkingAuth) {
    return (
      <main className="app">
        <p>Loading...</p>
      </main>
    );
  }

  const isLoggedIn =
    localStorage.getItem("token");

  if (!isLoggedIn) {
    return (
      <main className="app">
        <section className="login-container">
          <h1>Expense Tracker</h1>

          <p className="login-subtitle">
            {isRegistering
              ? "Create an account to start tracking expenses"
              : "Sign in to manage your expenses"}
          </p>

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <form
            onSubmit={
              isRegistering
                ? handleRegister
                : handleLogin
            }
          >
            {isRegistering && (
              <>
                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  required
                />
              </>
            )}

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              required
            />

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? isRegistering
                  ? "Creating account..."
                  : "Signing in..."
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setIsRegistering(
                !isRegistering,
              );
              setError("");
            }}
          >
            {isRegistering
              ? "Already have an account? Sign In"
              : "New here? Create an account"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Expense Tracker</h1>
          <p>
            Manage and track your expenses
          </p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <section className="expense-form-container">
        <h2>
          {editingExpenseId !== null
            ? "Edit Expense"
            : "Add Expense"}
        </h2>

        <form
          className="expense-form"
          onSubmit={handleExpenseSubmit}
        >
          <label htmlFor="amount">
            Amount
          </label>

          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(
                event.target.value,
              )
            }
            required
          />

          <label htmlFor="category">
            Category
          </label>

          <input
            id="category"
            type="text"
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value,
              )
            }
            required
          />

          <label htmlFor="date">
            Date
          </label>

          <input
            id="date"
            type="date"
            max={getTodayInputValue()}
            value={date}
            onChange={(event) => {
              const selectedDate =
                event.target.value;

              if (
                selectedDate &&
                selectedDate > getTodayInputValue()
              ) {
                setError(
                  "Date cannot be in the future.",
                );
                return;
              }

              setError("");
              setDate(selectedDate);
            }}
            required
          />

          <label htmlFor="note">
            Note
          </label>

          <input
            id="note"
            type="text"
            value={note}
            onChange={(event) =>
              setNote(
                event.target.value,
              )
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingExpenseId !== null
                ? "Update Expense"
                : "Add Expense"}
          </button>

          {editingExpenseId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="filters">
        <h2>Filter Expenses</h2>

        <label htmlFor="filter-month">
          Month
        </label>

        <input
          id="filter-month"
          type="month"
          value={filterMonth}
          onChange={(event) =>
            setFilterMonth(
              event.target.value,
            )
          }
        />

        <label htmlFor="filter-category">
          Category
        </label>

        <input
          id="filter-category"
          type="text"
          placeholder="e.g. Food"
          value={filterCategory}
          onChange={(event) =>
            setFilterCategory(
              event.target.value,
            )
          }
        />

        <button
          type="button"
          onClick={() => {
            setFilterMonth("");
            setFilterCategory("");
          }}
        >
          Clear Filters
        </button>
      </section>

      <section className="budget-section">
        <div className="budget-header">
          <div>
            <h2>Monthly Budgets</h2>
            <p>
              Set spending limits for
              each category.
            </p>
          </div>
        </div>

        <form
          className="budget-form"
          onSubmit={async (event) => {
            event.preventDefault();

            const budgetValue =
              Number(budgetAmount);

            const month =
              budgetMonth || filterMonth;

            if (
              !budgetValue ||
              budgetValue <= 0 ||
              !budgetCategory ||
              !month
            ) {
              setError(
                "Budget amount, category, and month are required.",
              );
              return;
            }

            setBudgetLoading(true);
            setError("");

            try {
              if (
                editingBudgetId !== null
              ) {
                await updateBudget(
                  editingBudgetId,
                  budgetValue,
                  budgetCategory,
                  month,
                );
              } else {
                await createBudget(
                  budgetValue,
                  budgetCategory,
                  month,
                );
              }

              setBudgetAmount("");
              setBudgetCategory("");
              setBudgetMonth("");
              setEditingBudgetId(null);

              await loadBudgets();
            } catch (error) {
              console.error(error);

              setError(
                "Failed to save budget",
              );
            } finally {
              setBudgetLoading(false);
            }
          }}
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Monthly budget"
            value={budgetAmount}
            onChange={(event) =>
              setBudgetAmount(
                event.target.value,
              )
            }
          />

          <input
            type="text"
            placeholder="Category"
            value={budgetCategory}
            onChange={(event) =>
              setBudgetCategory(
                event.target.value,
              )
            }
          />

          <input
            type="month"
            value={
              budgetMonth || filterMonth
            }
            onChange={(event) =>
              setBudgetMonth(
                event.target.value,
              )
            }
          />

          <button
            type="submit"
            disabled={budgetLoading}
          >
            {budgetLoading
              ? "Saving..."
              : editingBudgetId !== null
                ? "Update Budget"
                : "Set Budget"}
          </button>

          {editingBudgetId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingBudgetId(null);
                setBudgetAmount("");
                setBudgetCategory("");
                setBudgetMonth("");
              }}
              disabled={budgetLoading}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="budget-list">
          {budgets.length === 0 ? (
            <div className="budget-empty">
              No budgets set for this
              month.
            </div>
          ) : (
            budgets.map((budget) => {
              const categorySpending =
                summary?.byCategory.find(
                  (item) =>
                    item.category ===
                    budget.category,
                )?.total ?? 0;

              const budgetValue =
                Number(budget.amount);

              const isOverBudget =
                categorySpending >
                budgetValue;

              const percentage =
                budgetValue > 0
                  ? Math.min(
                    (categorySpending /
                      budgetValue) *
                    100,
                    100,
                  )
                  : 0;

              return (
                <div
                  className={`budget-card ${isOverBudget
                    ? "over-budget"
                    : ""
                    }`}
                  key={budget.id}
                >
                  <div className="budget-card-header">
                    <div>
                      <h3>
                        {budget.category}
                      </h3>

                      {isOverBudget && (
                        <span className="budget-warning">
                          Over budget
                        </span>
                      )}
                    </div>

                    <div className="budget-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBudgetId(
                            budget.id,
                          );

                          setBudgetAmount(
                            String(
                              budgetValue,
                            ),
                          );

                          setBudgetCategory(
                            budget.category,
                          );

                          setBudgetMonth(
                            budget.month,
                          );
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmed =
                            window.confirm(
                              "Delete this budget?",
                            );

                          if (!confirmed) {
                            return;
                          }

                          try {
                            await deleteBudget(
                              budget.id,
                            );

                            await loadBudgets();
                          } catch (error) {
                            console.error(
                              error,
                            );

                            setError(
                              "Failed to delete budget",
                            );
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="budget-values">
                    <span>
                      Spent: ₹
                      {categorySpending.toFixed(
                        2,
                      )}
                    </span>

                    <span>
                      Budget: ₹
                      {budgetValue.toFixed(
                        2,
                      )}
                    </span>
                  </div>

                  <div className="budget-progress">
                    <div
                      className="budget-progress-bar"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p
                    className={
                      isOverBudget
                        ? "budget-over-text"
                        : "budget-remaining"
                    }
                  >
                    {isOverBudget
                      ? `₹${(
                        categorySpending -
                        budgetValue
                      ).toFixed(
                        2,
                      )} over budget`
                      : `₹${(
                        budgetValue -
                        categorySpending
                      ).toFixed(
                        2,
                      )} remaining`}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {summary && (
        <section className="summary">
          <div className="summary-heading">
            <div>
              <span className="summary-eyebrow">
                SPENDING OVERVIEW
              </span>

              <h2>Monthly Spending</h2>

              <p>
                {filterMonth
                  ? new Date(`${filterMonth}-01T00:00:00`).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      year: "numeric",
                    },
                  )
                  : "All recorded expenses"}
              </p>
            </div>
          </div>

          <div className="summary-stats">
            <div>
              <strong>Total Spent</strong>
              <p>
                ₹{summary.total.toFixed(2)}
              </p>
              <small>Across all categories</small>
            </div>

            <div>
              <strong>Transactions</strong>
              <p>{summary.count}</p>
              <small>Expenses recorded</small>
            </div>

            <div>
              <strong>Avg. Expense</strong>
              <p>
                ₹{summary.average.toFixed(2)}
              </p>
              <small>Per transaction</small>
            </div>

            <div>
              <strong>Largest Expense</strong>
              <p>
                ₹{summary.highest.toFixed(2)}
              </p>
              <small>Highest single expense</small>
            </div>
          </div>

          <h3>By Category</h3>

          {summary.byCategory.length ===
            0 ? (
            <p>
              No expenses found for
              this month.
            </p>
          ) : (
            <div className="category-summary">
              {summary.byCategory.map(
                (item) => (
                  <div
                    className="category-summary-row"
                    key={item.category}
                  >
                    <span>
                      {item.category}
                    </span>

                    <span>
                      ₹
                      {item.total.toFixed(
                        2,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {error && (
        <p className="error">{error}</p>
      )}

      {!loading &&
        !error &&
        expenses.length === 0 && (
          <section className="empty-state">
            <h2>No expenses found</h2>

            <p>
              Add your first expense to
              get started.
            </p>
          </section>
        )}

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h2>
              Spending by Category
            </h2>

            <p>
              Your spending breakdown
              for the selected month.
            </p>
          </div>
        </div>

        {summary &&
          summary.byCategory.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart
                data={summary.byCategory}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="category"
                  tick={{
                    fontSize: 13,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 13,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value,
                    ).toFixed(2)}`
                  }
                />

                <Bar
                  dataKey="total"
                  name="Spending"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty">
            <p>
              No spending data for
              this month.
            </p>
          </div>
        )}
      </div>

      {!loading &&
        expenses.length > 0 && (
          <section className="expense-list">
            <div className="expense-list-header">
              <h2>Your Expenses</h2>

              <button
                type="button"
                className="export-button"
                onClick={
                  handleExportCsv
                }
                disabled={
                  expenses.length === 0
                }
                title={
                  expenses.length === 0
                    ? "No expenses to export"
                    : "Export the currently filtered expenses as CSV"
                }
              >
                Export CSV
              </button>
            </div>

            <div className="expense-table">
              <div className="table-header">
                <span>Date</span>
                <span>Category</span>
                <span>Note</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>

              {expenses.map(
                (expense, index) => (
                  <div
                    className="expense-row"
                    key={expense.id}
                    ref={
                      index ===
                        expenses.length - 1
                        ? lastExpenseRef
                        : undefined
                    }
                  >
                    <span>
                      {new Date(
                        expense.date,
                      ).toLocaleDateString()}
                    </span>

                    <span>
                      {expense.category}
                    </span>

                    <span>
                      {expense.note || "-"}
                    </span>

                    <span>
                      ₹
                      {Number(
                        expense.amount,
                      ).toFixed(2)}
                    </span>

                    <span>
                      <button
                        type="button"
                        onClick={() =>
                          handleEditExpense(
                            expense,
                          )
                        }
                        disabled={loading}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExpense(
                            expense.id,
                          )
                        }
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                ),
              )}

              {loadingMore && (
                <div className="loading-more">
                  Loading more
                  expenses...
                </div>
              )}

              {!loadingMore &&
                !hasMore &&
                expenses.length > 0 && (
                  <div className="end-of-expenses">
                    You've reached the
                    end of your expenses.
                  </div>
                )}
            </div>
          </section>
        )}
    </main>
  );
}

export default App;