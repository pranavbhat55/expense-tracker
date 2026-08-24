import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { login } from "./api/auth";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
} from "./api/expenses";
import type { Expense, ExpenseSummary } from "./types/expense";
import "./App.css";

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

  if (checkingAuth) {
    return (
      <main className="app">
        <p>Loading...</p>
      </main>
    );
  }

  const isLoggedIn = localStorage.getItem("token");


  if (!isLoggedIn) {
    return (
      <main className="app">
        <section className="login-container">
          <h1>Expense Tracker</h1>

          <p className="login-subtitle">
            Sign in to manage your expenses
          </p>

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <form onSubmit={handleLogin}>
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
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
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
              setAmount(event.target.value)
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
              setCategory(event.target.value)
            }
            required
          />

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

          <label htmlFor="note">
            Note
          </label>

          <input
            id="note"
            type="text"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Adding..."
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
            setFilterMonth(event.target.value)
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
            setFilterCategory(event.target.value)
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
      {summary && (
        <section className="summary">
          <h2>
            Expense Summary
            {filterMonth ? ` - ${filterMonth}` : ""}
          </h2>

          <div className="summary-stats">
            <div>
              <strong>Total</strong>
              <p>₹{summary.total.toFixed(2)}</p>
            </div>

            <div>
              <strong>Expenses</strong>
              <p>{summary.count}</p>
            </div>

            <div>
              <strong>Average</strong>
              <p>₹{summary.average.toFixed(2)}</p>
            </div>

            <div>
              <strong>Highest</strong>
              <p>₹{summary.highest.toFixed(2)}</p>
            </div>
          </div>

          <h3>By Category</h3>

          {summary.byCategory.length === 0 ? (
            <p>No expenses found for this month.</p>
          ) : (
            <div className="category-summary">
              {summary.byCategory.map((item) => (
                <div
                  className="category-summary-row"
                  key={item.category}
                >
                  <span>{item.category}</span>

                  <span>
                    ₹{item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {loading && (<p>Loading expenses...</p>
      )}

      {error && (
        <p className="error">{error}</p>
      )}

      {!loading && !error && expenses.length === 0 && (
        <section className="empty-state">
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
                    onClick={() => handleEditExpense(expense)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={loading}
                  >
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