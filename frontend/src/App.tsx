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
  getInvitationPreview,
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
  getWorkspaceSettings,
  updateWorkspaceSettings,
  listInvitations,
  createInvitation,
  revokeInvitation,
  type WorkspaceInvitation,
  type WorkspaceSettings,
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
import { BudgetCards } from "./components/budgets/BudgetCards";
import { BudgetForm } from "./components/budgets/BudgetForm";
import { TimelineReportView } from "./components/timeline/TimelineReport";
import { MembersSection } from "./components/workspace/MembersSection";
import { ScopeToggle } from "./components/common/ScopeToggle";
import { InvitePanel } from "./components/workspace/InvitePanel";
import { AuthScreen, type InviteState } from "./components/auth/AuthScreen";
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
  // Owners/admins can switch between their own spending and the whole team's; members never see the toggle.
  const [expenseScope, setExpenseScope] = useState<"mine" | "team">("mine");
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null"); } catch { return null; }
  });
  const [budgetDrawerOpen, setBudgetDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] =
    useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const observerRef =
    useRef<IntersectionObserver | null>(null);

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [personalSummary, setPersonalSummary] = useState<ExpenseSummary | null>(null);
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

  const [isRegistering, setIsRegistering] =
    useState(false);

  // Invite links look like /?invite=<token>. The token pins the organization, role and email.
  const [inviteToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("invite"),
  );
  const [invite, setInvite] = useState<InviteState>(() =>
    ({ status: new URLSearchParams(window.location.search).get("invite") ? "loading" : "none" }),
  );
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteError, setInviteError] = useState("");

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
          expenseScope,
        );

      setSummary(response);

      // Budgets are always personal (Budget.userId), regardless of any Dashboard/Expenses
      // "Whole team" toggle - so they must never be measured against team-wide spend.
      if (expenseScope === "mine") {
        setPersonalSummary(response);
      } else {
        setPersonalSummary(
          await getExpenseSummary(filterMonth || undefined, "mine"),
        );
      }
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
        expenseScope,
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
    [loadingMore, hasMore, page, filterMonth, filterCategory, expenseScope],
  );

  useEffect(() => {
    if (!inviteToken) return;
    getInvitationPreview(inviteToken)
      .then((preview) => {
        setInvite({ status: "ready", email: preview.email, role: preview.role, organization: preview.organization });
        setEmail(preview.email);
        setIsRegistering(true);
      })
      .catch((err) => setInvite({ status: "invalid", message: err instanceof Error ? err.message : "The link is invalid." }));
  }, [inviteToken]);

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
  }, [filterMonth, filterCategory, expenseScope]);

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
      const who = { name: response.user.name, email: response.user.email, role: response.user.role };
      localStorage.setItem("user", JSON.stringify(who));
      setCurrentUser(who);

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
        undefined,
        inviteToken ?? undefined,
      );
      if (inviteToken) window.history.replaceState(null, "", window.location.pathname);

      localStorage.setItem(
        "token",
        response.token,
      );
      const who = { name: response.user.name, email: response.user.email, role: response.user.role };
      localStorage.setItem("user", JSON.stringify(who));
      setCurrentUser(who);

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
    localStorage.removeItem("user");
    setCurrentUser(null);
    setExpenseScope("mine");

    setExpenses([]);
    setSummary(null);
    setPersonalSummary(null);
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
      <AuthScreen
        mode={isRegistering ? "create" : "signin"}
        onModeChange={(mode) => { setIsRegistering(mode === "create"); setError(""); }}
        invite={invite}
        name={name}
        email={email}
        password={password}
        loading={loading}
        error={error}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={isRegistering ? handleRegister : handleLogin}
      />
    );
  }

  async function loadMembers() {
    try {
      setMembersLoading(true);
      setMembersError("");
      setMembers(await getMembers());
      const [settings, pending] = await Promise.allSettled([getWorkspaceSettings(), listInvitations()]);
      if (settings.status === "fulfilled") setWorkspaceSettings(settings.value);
      setInvitations(pending.status === "fulfilled" ? pending.value : []);
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
    if (!window.confirm(`Deactivate ${member.name}? They lose access immediately and the seat is freed. Their expense history is kept.`)) return;
    try {
      setMembersError("");
      await removeMember(member.id);
      await Promise.all([loadMembers(), loadAuditLogs(auditPage)]);
    } catch (error) {
      setMembersError(error instanceof Error ? error.message : "Failed to deactivate member");
    }
  }

  async function handleInvite(inviteEmail: string, role: "ADMIN" | "MEMBER"): Promise<string | null> {
    try {
      setInviteError("");
      const created = await createInvitation(inviteEmail, role);
      await Promise.all([loadMembers(), loadAuditLogs(1)]);
      return created.token;
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to create invitation");
      return null;
    }
  }

  async function handleRevokeInvite(id: number) {
    try {
      setInviteError("");
      await revokeInvitation(id);
      await Promise.all([loadMembers(), loadAuditLogs(1)]);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to revoke invitation");
    }
  }

  async function handleToggleInviteOnly(value: boolean) {
    try {
      setInviteError("");
      setWorkspaceSettings(await updateWorkspaceSettings(value));
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to update workspace settings");
    }
  }

  const canManageSubscription = subscription?.role === "OWNER";
  const canInvite = subscription?.role === "OWNER" || subscription?.role === "ADMIN";
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
              workspaceName={workspaceSettings?.name ?? "Your workspace"}
              canViewMembers={canManageSubscription || members.length > 0}
              canViewBilling={Boolean(subscription)}
              canViewAdmin={canViewAdmin}
              plan={subscription?.plan ?? "FREE"}
        seats={workspaceSettings ? `${workspaceSettings.seats.used}${workspaceSettings.seats.limit === null ? "" : ` / ${workspaceSettings.seats.limit}`} seats` : undefined}
            />
          </div>
        </div>
      )}
      <Sidebar
        active={view}
        onNavigate={setView}
        workspaceName={workspaceSettings?.name ?? "Your workspace"}
        canViewMembers={canManageSubscription || members.length > 0}
        canViewBilling={Boolean(subscription)}
        canViewAdmin={canViewAdmin}
        plan={subscription?.plan ?? "FREE"}
        seats={workspaceSettings ? `${workspaceSettings.seats.used}${workspaceSettings.seats.limit === null ? "" : ` / ${workspaceSettings.seats.limit}`} seats` : undefined}
      />
      <main className="app-shell__main">
        <TopBar
          title={viewTitles[view]}
          userName={currentUser?.name ?? ""}
          userEmail={currentUser?.email ?? email}
          role={subscription?.role ?? currentUser?.role}
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

      <section style={{ display: view === "expenses" ? undefined : "none" }}>
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



      <BudgetForm
        open={budgetDrawerOpen}
        onClose={() => {
          setBudgetDrawerOpen(false);
          setEditingBudgetId(null);
          setBudgetAmount("");
          setBudgetCategory("");
          setBudgetMonth("");
        }}
        isEditing={editingBudgetId !== null}
        amount={budgetAmount}
        category={budgetCategory}
        month={budgetMonth || filterMonth}
        loading={budgetLoading}
        onAmountChange={setBudgetAmount}
        onCategoryChange={setBudgetCategory}
        onMonthChange={setBudgetMonth}
        onSubmit={async (event) => {
          event.preventDefault();

          if (!canUseBudgets) {
            setError("Budgets are not included in your current plan. Upgrade to PRO to use this feature.");
            return;
          }

          const budgetValue = Number(budgetAmount);
          const month = budgetMonth || filterMonth;

          if (!budgetValue || budgetValue <= 0 || !budgetCategory || !month) {
            setError("Budget amount, category, and month are required.");
            return;
          }

          setBudgetLoading(true);
          setError("");

          try {
            if (editingBudgetId !== null) {
              await updateBudget(editingBudgetId, budgetValue, budgetCategory, month);
            } else {
              await createBudget(budgetValue, budgetCategory, month);
            }
            setBudgetAmount("");
            setBudgetCategory("");
            setBudgetMonth("");
            setEditingBudgetId(null);
            setBudgetDrawerOpen(false);
            await loadBudgets();
          } catch (error) {
            console.error(error);
            setError("Failed to save budget");
          } finally {
            setBudgetLoading(false);
          }
        }}
      />

      <section style={{ display: view === "budgets" ? undefined : "none" }}>
        <div className="db-card-header">
          <h2>Budgets</h2>
          <p>Set spending limits for each category.</p>
        </div>

        {!canUseBudgets && subscription && (
          <p className="feature-lock">Budgets are not included in your current plan. Upgrade to PRO to manage category budgets.</p>
        )}

        <div className="bg-toolbar">
          <button
            type="button"
            className="ui-btn ui-btn--primary"
            disabled={!canUseBudgets}
            onClick={() => {
              setEditingBudgetId(null);
              setBudgetAmount("");
              setBudgetCategory("");
              setBudgetMonth("");
              setBudgetDrawerOpen(true);
            }}
          >
            + Set budget
          </button>
        </div>

        <BudgetCards
          budgets={budgets}
          summary={personalSummary}
          onAdd={() => setBudgetDrawerOpen(true)}
          onEdit={(budget) => {
            setEditingBudgetId(budget.id);
            setBudgetAmount(String(Number(budget.amount)));
            setBudgetCategory(budget.category);
            setBudgetMonth(budget.month);
            setBudgetDrawerOpen(true);
          }}
          onDelete={async (id) => {
            const confirmed = window.confirm("Delete this budget?");
            if (!confirmed) return;
            try {
              await deleteBudget(id);
              await loadBudgets();
            } catch (error) {
              console.error(error);
              setError("Failed to delete budget");
            }
          }}
        />
      </section>

      {view === "dashboard" && summary && (
        <div className="db-dashboard-view">
          {canInvite && (
            <div className="db-scope"><ScopeToggle value={expenseScope} onChange={setExpenseScope} /></div>
          )}
          <StatCards
            summary={summary}
            periodLabel={
              (expenseScope === "team" ? "Whole team · " : "") + (filterMonth
                ? new Date(`${filterMonth}-01T00:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
                : "All recorded expenses")
            }
          />
          <div className="db-dashboard-grid">
            <SpendingChart summary={summary} />
            <CategoryBreakdown summary={summary} />
          </div>
          <div className="db-dashboard-grid--secondary">
            <BudgetHealth budgets={budgets} summary={personalSummary} />
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
        {canInvite && (
          <InvitePanel
            settings={workspaceSettings}
            invitations={invitations}
            isOwner={canManageSubscription}
            error={inviteError}
            onInvite={handleInvite}
            onRevoke={handleRevokeInvite}
            onToggleInviteOnly={handleToggleInviteOnly}
          />
        )}
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



      <section style={{ display: view === "expenses" ? undefined : "none" }}>
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
          scope={expenseScope}
          canViewTeam={canInvite}
          onScopeChange={setExpenseScope}
        />
      </section>
        </div>
        <MobileNavigation active={view} onNavigate={setView} />
      </main>
    </div>
  );
}

export default App;

