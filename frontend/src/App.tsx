import { useEffect, useState } from "react";
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
} from "./api/expenses";
import type { Expense, ExpenseSummary } from "./types/expense";
import "./App.css";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");

    if (stored === "light" || stored === "dark") {
      return stored;
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      return "light";
    }
  } catch (error) {
    console.error(error);
  }

  return "dark";
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] =
    useState<ExpenseSummary | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingExpenseId, setEditingExpenseId] =
    useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] =
    useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error(error);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    loadExpenses();
    loadSummary();
  }, [filterMonth, filterCategory]);

  async function loadSummary() {
    try {
      const response = await getExpenseSummary(
        filterMonth || undefined,
      );

      setSummary(response);
    } catch (error) {
      console.error(error);
      setError("Failed to load expense summary");
    }
  }

  async function loadExpenses() {
    setLoading(true);
    setError("");

    try {
      const response = await getExpenses(
        filterMonth || undefined,
        filterCategory || undefined,
      );
      setExpenses(response.data);
    } catch (error) {
      console.error(error);
      localStorage.removeItem("token");
      setError("Your session has expired. Please log in again.");
    } finally {
      setLoading(false);
      setCheckingAuth(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await login(email, password);

      localStorage.setItem("token", response.token);

      await loadExpenses();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to login");
      }

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

      await loadExpenses();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create account");
      }

      setLoading(false);
    }
  }
  async function handleExpenseSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

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

      await loadExpenses();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save expense");
      }

      setLoading(false);
    }
  }
  function handleEditExpense(expense: Expense) {
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
  }

  function handleCancelEdit() {
    setEditingExpenseId(null);
    setAmount("");
    setCategory("");
    setDate("");
    setNote("");
  }
  async function handleDeleteExpense(id: number) {
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

      await loadExpenses();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to delete expense");
      }

      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setExpenses([]);
    setEmail("");
    setPassword("");
    setError("");
  }

  const themeToggleButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );

  if (checkingAuth) {
    return (
      <main className="app app--center">
        <div className="boot-loader">
          <span className="spinner" aria-hidden="true" />
          <p>Loading your ledger…</p>
        </div>
      </main>
    );
  }

  const isLoggedIn = localStorage.getItem("token");

  const maxCategoryTotal =
    summary && summary.byCategory.length > 0
      ? Math.max(...summary.byCategory.map((item) => item.total))
      : 0;

  if (!isLoggedIn) {
    return (
      <main className="app app--center">
        <section className="login-container">
          <div className="login-top-row">
            <div className="brand-mark" aria-hidden="true">₹</div>
            {themeToggleButton}
          </div>

          <h1>Expense Tracker</h1>

          <p className="login-subtitle">
            {isRegistering
              ? "Create an account to start tracking expenses"
              : "Sign in to manage your expenses"}
          </p>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isRegistering}
              className={
                !isRegistering ? "auth-tab is-active" : "auth-tab"
              }
              onClick={() => {
                setIsRegistering(false);
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRegistering}
              className={
                isRegistering ? "auth-tab is-active" : "auth-tab"
              }
              onClick={() => {
                setIsRegistering(true);
                setError("");
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <p className="error" role="alert">
              <span className="error-icon" aria-hidden="true">!</span>
              {error}
            </p>
          )}

          <form
            onSubmit={
              isRegistering
                ? handleRegister
                : handleLogin
            }
          >{isRegistering && (
            <>
              <label htmlFor="name">
                Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Jane Doe"
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
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
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
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              required
            />

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={loading}
            >
              {loading ? isRegistering
                ? "Creating account…"
                : "Signing in…"
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}

            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div className="header-title">
          <span className="brand-mark brand-mark--sm" aria-hidden="true">₹</span>
          <div>
            <h1>Expense Tracker</h1>
            <p>
              Manage and track your expenses
            </p>
          </div>
        </div>

        <div className="header-actions">
          {themeToggleButton}

          <button
            className="btn btn--ghost"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
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
          <div className="field">
            <label htmlFor="amount">
              Amount
            </label>

            <div className="input-prefix">
              <span aria-hidden="true">₹</span>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="category">
              Category
            </label>

            <input
              id="category"
              type="text"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              placeholder="e.g. Food"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="date">
              Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              required
            />
          </div>

          <div className="field">
            <label htmlFor="note">
              Note <span className="field-optional">(optional)</span>
            </label>

            <input
              id="note"
              type="text"
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder="Add a note"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading
                ? editingExpenseId !== null
                  ? "Saving…"
                  : "Adding…"
                : editingExpenseId !== null
                  ? "Save Changes"
                  : "Add Expense"}
            </button>
            {editingExpenseId !== null && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="filters">
        <h2>Filter Expenses</h2>

        <div className="filters-row">
          <label htmlFor="filter-month">
            Month
            <input
              id="filter-month"
              type="month"
              value={filterMonth}
              onChange={(event) =>
                setFilterMonth(event.target.value)
              }
            />
          </label>

          <label htmlFor="filter-category">
            Category
            <input
              id="filter-category"
              type="text"
              placeholder="e.g. Food"
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setFilterMonth("");
              setFilterCategory("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {summary && (
        <section className="summary">
          <h2>
            Expense Summary
            {filterMonth ? ` — ${filterMonth}` : ""}
          </h2>

          <div className="summary-stats">
            <div className="stat-card">
              <strong>Total</strong>
              <p>₹{summary.total.toFixed(2)}</p>
            </div>

            <div className="stat-card">
              <strong>Expenses</strong>
              <p>{summary.count}</p>
            </div>

            <div className="stat-card">
              <strong>Average</strong>
              <p>₹{summary.average.toFixed(2)}</p>
            </div>

            <div className="stat-card">
              <strong>Highest</strong>
              <p>₹{summary.highest.toFixed(2)}</p>
            </div>
          </div>

          <h3>By Category</h3>

          {summary.byCategory.length === 0 ? (
            <p className="muted">No expenses found for this month.</p>
          ) : (
            <div className="category-summary">
              {summary.byCategory.map((item) => (
                <div
                  className="category-summary-row"
                  key={item.category}
                >
                  <div className="category-summary-head">
                    <span>{item.category}</span>
                    <span className="mono">
                      ₹{item.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{
                        width:
                          maxCategoryTotal > 0
                            ? `${(item.total / maxCategoryTotal) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {loading && (
        <div className="state-card">
          <span className="spinner" aria-hidden="true" />
          <p>Loading expenses…</p>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          <span className="error-icon" aria-hidden="true">!</span>
          {error}
        </p>
      )}

      {!loading && !error && expenses.length === 0 && (
        <section className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2>No expenses found</h2>
          <p>
            Add your first expense to get started.
          </p>
        </section>
      )}

      {!loading && expenses.length > 0 && (
        <section className="expense-list">
          <h2>Your Expenses</h2>

          <div className="expense-table">
            <div className="table-header">
              <span>Date</span>
              <span>Category</span>
              <span>Note</span>
              <span>Amount</span>
              <span>Actions</span>
            </div>

            {expenses.map((expense) => (
              <div
                className="expense-row"
                key={expense.id}
              >
                <span data-label="Date">
                  {new Date(
                    expense.date,
                  ).toLocaleDateString()}
                </span>

                <span data-label="Category">
                  <span className="category-chip">
                    {expense.category}
                  </span>
                </span>

                <span data-label="Note" className="note-cell">
                  {expense.note || "—"}
                </span>

                <span data-label="Amount" className="mono amount-cell">
                  ₹
                  {Number(
                    expense.amount,
                  ).toFixed(2)}
                </span>

                <span data-label="Actions" className="actions-cell">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleEditExpense(expense)}
                    disabled={loading}
                    aria-label="Edit expense"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={loading}
                    aria-label="Delete expense"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;