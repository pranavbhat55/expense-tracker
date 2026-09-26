/* eslint-disable react-refresh/only-export-components, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
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

import type { TimelineReport } from "./types/report";
import { getTimelineReport } from "./api/reports";
import {
  createSubscription,
  getSubscription,
  changeSubscription,
  type Subscription,
} from "./api/subscription";
import {
  changeMemberRole,
  getAuditLogs,
  getMembers,
  removeMember,
  type AuditLog,
  type WorkspaceMember,
  type WorkspaceRole,
} from "./api/workspace";


import "./App.css";
import { Sidebar, type NavKey } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { MobileNavigation } from "./components/layout/MobileNavigation";
import { StatCards } from "./components/dashboard/StatCards";
import { SpendingChart } from "./components/dashboard/SpendingChart";
import { CategoryBreakdown } from "./components/dashboard/CategoryBreakdown";
import { BudgetHealth } from "./components/dashboard/BudgetHealth";
import { RecentExpenses } from "./components/dashboard/RecentExpenses";
import { ExpenseFilters } from "./components/expenses/ExpenseFilters";
import { ExpenseTable } from "./components/expenses/ExpenseTable";
import { ExpenseDrawer } from "./components/expenses/ExpenseDrawer";
import { TimelineReportView } from "./components/timeline/TimelineReport";
import { MembersSection } from "./components/workspace/MembersSection";
import { ActivitySection } from "./components/workspace/ActivitySection";
import { BillingSection } from "./components/billing/BillingSection";
import { PlatformAdminSection } from "./components/admin/PlatformAdminSection";

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

export { describeAuditLog } from "./components/workspace/auditUtils";

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
  const [view, setView] = useState<NavKey>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
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

  const [timelineReport, setTimelineReport] =
    useState<TimelineReport | null>(null);

  const [timelineFrom, setTimelineFrom] =
    useState("2026-08-01");

  const [timelineTo, setTimelineTo] =
    useState("2026-09-01");

  const [timelineGroupBy, setTimelineGroupBy] =
    useState<"day" | "week" | "month">("day");

  const [timelineLoading, setTimelineLoading] =
    useState(false);

  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [subscriptionLoading, setSubscriptionLoading] =
    useState(false);

  const [subscriptionError, setSubscriptionError] =
    useState("");

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const [timelineError, setTimelineError] =
    useState("");

  const [selectedPlan, setSelectedPlan] =
    useState<"FREE" | "PRO" | "BUSINESS">("PRO");

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

  const [workspaceSlug, setWorkspaceSlug] =
    useState("");

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

  async function loadTimelineReport() {
    try {
      setTimelineLoading(true);
      setTimelineError("");

      const response = await getTimelineReport(
        timelineFrom,
        timelineTo,
        timelineGroupBy,
      );

      setTimelineReport(response);
    } catch (error) {
      console.error(
        "Failed to load timeline report:",
        error,
      );
      setTimelineReport(null);
      setTimelineError(
        error instanceof Error
          ? error.message
          : "Unable to load the timeline report.",
      );
    } finally {
      setTimelineLoading(false);
    }
  }

  async function loadSubscription() {
    try {
      setSubscriptionError("");
      const response = await getSubscription();
      setSubscription(response);
      setSelectedPlan(response.plan);
    } catch (error) {
      console.error(
        "Failed to load subscription:",
        error,
      );

      if (
        error instanceof Error &&
        error.message === "No subscription found"
      ) {
        setSubscription(null);
        return;
      }

      setSubscriptionError(
        error instanceof Error
          ? error.message
          : "Failed to load subscription",
      );
    }
  }

  async function handleSubscriptionChange() {
    try {
      setSubscriptionLoading(true);
      setSubscriptionError("");

      const response = subscription
        ? await changeSubscription(selectedPlan)
        : await createSubscription(selectedPlan);

      setSubscription(response);
      setSelectedPlan(response.plan);
      await loadSubscription();
      await loadTimelineReport();
    } catch (error) {
      console.error(
        "Failed to update subscription:",
        error,
      );

      setSubscriptionError(
        error instanceof Error
          ? error.message
          : "Failed to update subscription",
      );
    } finally {
      setSubscriptionLoading(false);
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
    loadTimelineReport();
    loadSubscription();
    loadMembers();
    loadAuditLogs();
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
      await loadTimelineReport();
      await loadSubscription();
      await loadMembers();
      await loadAuditLogs();
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
        workspaceSlug,
      );

      localStorage.setItem(
        "token",
        response.token,
      );

      setCheckingAuth(false);

      await loadExpenses();
      await loadSummary();
      await loadBudgets();
      await loadTimelineReport();
      await loadSubscription();
      await loadMembers();
      await loadAuditLogs();
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
    if (!subscription?.entitlements?.features.csvExport) {
      setError("CSV export is not included in your current plan. Upgrade to PRO to export expenses.");
      return;
    }

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
    setTimelineReport(null);
    setSubscription(null);
    setSubscriptionError("");
    setMembers([]);
    setAuditLogs([]);
    setMembersError("");
    setAuditError("");
    setTimelineError("");

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

                <label htmlFor="workspace-slug">
                  Workspace slug (optional)
                </label>

                <input
                  id="workspace-slug"
                  type="text"
                  value={workspaceSlug}
                  onChange={(event) =>
                    setWorkspaceSlug(event.target.value)
                  }
                  placeholder="e.g. acme-finance"
                />
                <small className="workspace-hint">
                  Choose a new slug to create a workspace, or enter an existing slug to join it.
                </small>
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

  async function loadMembers() {
    try {
      setMembersLoading(true);
      setMembersError("");
      setMembers(await getMembers());
    } catch (error) {
      setMembersError(error instanceof Error ? error.message : "Failed to load workspace members");
    } finally {
      setMembersLoading(false);
    }
  }

  async function loadAuditLogs(pageToLoad = 1) {
    try {
      setAuditLoading(true);
      setAuditError("");
      const response = await getAuditLogs(pageToLoad);
      setAuditLogs(response.data);
      setAuditPage(response.pagination.page);
      setAuditTotalPages(response.pagination.totalPages);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Failed to load workspace activity");
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleRoleChange(member: WorkspaceMember, role: WorkspaceRole) {
    try {
      setMembersError("");
      await changeMemberRole(member.id, role);
      await Promise.all([loadMembers(), loadAuditLogs(auditPage)]);
    } catch (error) {
      setMembersError(error instanceof Error ? error.message : "Failed to change member role");
    }
  }

  async function handleRemoveMember(member: WorkspaceMember) {
    if (!window.confirm(`Remove ${member.name} from this workspace?`)) return;
    try {
      setMembersError("");
      await removeMember(member.id);
      await Promise.all([loadMembers(), loadAuditLogs(auditPage)]);
    } catch (error) {
      setMembersError(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  const canManageSubscription = subscription?.role === "OWNER";
  const canViewAdmin = subscription?.isSuperAdmin === true;
  const canUseBudgets = subscription?.entitlements?.features.budgets ?? false;
  const canUseTimeline = subscription?.entitlements?.features.timelineReports ?? false;
  const canExportCsv = subscription?.entitlements?.features.csvExport ?? false;
  const quota = subscription?.entitlements?.limits.maxExpensesPerMonth;
  const usage = subscription?.entitlements?.usage?.expensesThisMonth;

  const viewTitles: Record<NavKey, string> = {
    dashboard: "Dashboard",
    expenses: "Expenses",
    budgets: "Budgets",
    timeline: "Timeline",
    members: "Workspace Members",
    activity: "Workspace Activity",
    billing: "Billing",
    admin: "Platform Admin",
  };

  return (
    <div className="app-shell">
      {mobileNavOpen && (
        <div
          className="ui-modal__overlay"
          style={{ zIndex: 30 }}
          onClick={() => setMobileNavOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar
              active={view}
              onNavigate={(key) => {
                setView(key);
                setMobileNavOpen(false);
              }}
              workspaceName={workspaceSlug || "Your workspace"}
              canViewMembers={canManageSubscription || members.length > 0}
              canViewBilling={Boolean(subscription)}
              canViewAdmin={canViewAdmin}
              plan={subscription?.plan ?? "FREE"}
            />
          </div>
        </div>
      )}
      <Sidebar
        active={view}
        onNavigate={setView}
        workspaceName={workspaceSlug || "Your workspace"}
        canViewMembers={canManageSubscription || members.length > 0}
        canViewBilling={Boolean(subscription)}
        canViewAdmin={canViewAdmin}
        plan={subscription?.plan ?? "FREE"}
      />
      <main className="app-shell__main">
        <TopBar
          title={viewTitles[view]}
          userEmail={email}
          onLogout={handleLogout}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="app-shell__content">
      <ExpenseDrawer
        open={expenseDrawerOpen}
        onClose={() => {
          setExpenseDrawerOpen(false);
          handleCancelEdit();
        }}
        isEditing={editingExpenseId !== null}
        amount={amount}
        category={category}
        date={date}
        note={note}
        maxDate={getTodayInputValue()}
        loading={loading}
        onAmountChange={setAmount}
        onCategoryChange={setCategory}
        onDateChange={(selectedDate) => {
          if (selectedDate && selectedDate > getTodayInputValue()) {
            setError("Date cannot be in the future.");
            return;
          }
          setError("");
          setDate(selectedDate);
        }}
        onNoteChange={setNote}
        onSubmit={async (event) => {
          await handleExpenseSubmit(event);
          setExpenseDrawerOpen(false);
        }}
      />

      <section className="filters" style={{ display: view === "expenses" ? undefined : "none" }}>
        <ExpenseFilters
          filterMonth={filterMonth}
          filterCategory={filterCategory}
          onFilterMonthChange={setFilterMonth}
          onFilterCategoryChange={setFilterCategory}
          onClear={() => {
            setFilterMonth("");
            setFilterCategory("");
          }}
        />
      </section>


      <section className="budget-section" style={{ display: view === "budgets" ? undefined : "none" }}>
        <div className="budget-header">
          <div>
            <h2>Monthly Budgets</h2>
            <p>
              Set spending limits for
              each category.
            </p>
          </div>
        </div>

        {!canUseBudgets && subscription && (
          <p className="feature-lock">
            Budgets are not included in your current plan. Upgrade to PRO to manage category budgets.
          </p>
        )}

        <form
          className="budget-form"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!canUseBudgets) {
              setError("Budgets are not included in your current plan. Upgrade to PRO to use this feature.");
              return;
            }

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
            disabled={!canUseBudgets}
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
            disabled={!canUseBudgets}
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
            disabled={!canUseBudgets}
            onChange={(event) =>
              setBudgetMonth(
                event.target.value,
              )
            }
          />

          <button
            type="submit"
            disabled={budgetLoading || !canUseBudgets}
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

      {view === "dashboard" && summary && (
        <div className="db-dashboard-view">
          <StatCards
            summary={summary}
            periodLabel={
              filterMonth
                ? new Date(`${filterMonth}-01T00:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
                : "All recorded expenses"
            }
          />
          <div className="db-dashboard-grid">
            <SpendingChart summary={summary} />
            <CategoryBreakdown summary={summary} />
          </div>
          <div className="db-dashboard-grid--secondary">
            <BudgetHealth budgets={budgets} summary={summary} />
            <RecentExpenses expenses={expenses} />
          </div>
        </div>
      )}

      {error && (
        <p className="error">{error}</p>
      )}

      <section style={{ display: view === "billing" ? undefined : "none" }}>
        <BillingSection
          subscription={subscription}
          error={subscriptionError}
          usage={usage ?? 0}
          quota={quota ?? null}
          selectedPlan={selectedPlan}
          canManageSubscription={canManageSubscription}
          subscriptionLoading={subscriptionLoading}
          onSelectPlan={setSelectedPlan}
          onChangePlan={handleSubscriptionChange}
        />
      </section>

      <section style={{ display: view === "members" ? undefined : "none" }}>
        <MembersSection
          members={members}
          loading={membersLoading}
          error={membersError}
          canManage={canManageSubscription}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
        />
      </section>

      <section style={{ display: view === "activity" ? undefined : "none" }}>
        <ActivitySection
          logs={auditLogs}
          loading={auditLoading}
          error={auditError}
          page={auditPage}
          totalPages={auditTotalPages}
          onPageChange={loadAuditLogs}
        />
      </section>

      {canViewAdmin && (
        <section style={{ display: view === "admin" ? undefined : "none" }}>
          <PlatformAdminSection />
        </section>
      )}

      <section style={{ display: view === "timeline" ? undefined : "none" }}>
        <TimelineReportView
          canUseTimeline={canUseTimeline}
          from={timelineFrom}
          to={timelineTo}
          groupBy={timelineGroupBy}
          loading={timelineLoading}
          error={timelineError}
          report={timelineReport}
          onFromChange={setTimelineFrom}
          onToChange={setTimelineTo}
          onGroupByChange={setTimelineGroupBy}
          onGenerate={loadTimelineReport}
        />
      </section>



      <section className="expense-list" style={{ display: view === "expenses" ? undefined : "none" }}>
        <ExpenseTable
          expenses={expenses}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          canExportCsv={canExportCsv}
          onAddExpense={() => {
            handleCancelEdit();
            setExpenseDrawerOpen(true);
          }}
          onEditExpense={(expense) => {
            handleEditExpense(expense);
            setExpenseDrawerOpen(true);
          }}
          onDeleteExpense={handleDeleteExpense}
          onExportCsv={handleExportCsv}
          lastExpenseRef={lastExpenseRef}
        />
      </section>
        </div>
        <MobileNavigation active={view} onNavigate={setView} />
      </main>
    </div>
  );
}

export default App;

