import { Button, Card, EmptyState, LoadingState } from "../common/primitives";
import type { Expense } from "../../types/expense";
import { ScopeToggle } from "../common/ScopeToggle";
import "./expenses.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ExpenseTable({
  expenses,
  loading,
  loadingMore,
  hasMore,
  canExportCsv,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onExportCsv,
  lastExpenseRef,
  scope,
  canViewTeam,
  onScopeChange,
}: {
  expenses: Expense[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  canExportCsv: boolean;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: number) => void;
  onExportCsv: () => void;
  lastExpenseRef: (node: HTMLDivElement | null) => void;
  scope: "mine" | "team";
  canViewTeam: boolean;
  onScopeChange: (scope: "mine" | "team") => void;
}) {
  const team = scope === "team";
  return (
    <Card className="ex-table-card" padded={false}>
      <div className="ex-table-card__header">
        <h2>{team ? "Team expenses" : "Your expenses"}</h2>
        <div className="ex-table-card__actions">
          {canViewTeam && <ScopeToggle value={scope} onChange={onScopeChange} />}
          <Button
            variant="secondary"
            onClick={onExportCsv}
            disabled={expenses.length === 0 || !canExportCsv}
            title={
              expenses.length === 0
                ? "No expenses to export"
                : !canExportCsv
                  ? "Upgrade to PRO to export expenses as CSV"
                  : "Export the currently filtered expenses as CSV"
            }
          >
            {canExportCsv ? "Export CSV" : "CSV export requires PRO"}
          </Button>
          <Button onClick={onAddExpense}>+ Add expense</Button>
        </div>
      </div>

      {loading && expenses.length === 0 ? (
        <LoadingState label="Loading expenses…" />
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses found" description="Add your first expense to get started." action={<Button onClick={onAddExpense}>Add expense</Button>} />
      ) : (
        <div className={`ex-table ${team ? "ex-table--team" : ""}`}>
          <div className="ex-table__row ex-table__row--head">
            <span>Date</span>
            {team && <span>Employee</span>}
            <span>Category</span>
            <span>Note</span>
            <span className="ex-table__amount">Amount</span>
            {!team && <span className="ex-table__actions-head">Actions</span>}
          </div>

          {expenses.map((expense, index) => (
            <div
              className="ex-table__row"
              key={expense.id}
              ref={index === expenses.length - 1 ? lastExpenseRef : undefined}
            >
              <span>{new Date(expense.date).toLocaleDateString()}</span>
              {team && <span className="ex-table__who">{expense.user?.name ?? "—"}</span>}
              <span>{expense.category}</span>
              <span className="ex-table__note">{expense.note || "—"}</span>
              <span className="ex-table__amount num">{formatCurrency(Number(expense.amount))}</span>
              {!team && (
              <span className="ex-table__actions">
                <button className="ex-table__action" onClick={() => onEditExpense(expense)} disabled={loading}>
                  Edit
                </button>
                <button className="ex-table__action ex-table__action--danger" onClick={() => onDeleteExpense(expense.id)} disabled={loading}>
                  Delete
                </button>
              </span>
              )}
            </div>
          ))}

          {loadingMore && <div className="ex-table__footer-note">Loading more expenses…</div>}
          {!loadingMore && !hasMore && expenses.length > 0 && (
            <div className="ex-table__footer-note">You've reached the end of your expenses.</div>
          )}
        </div>
      )}
    </Card>
  );
}
