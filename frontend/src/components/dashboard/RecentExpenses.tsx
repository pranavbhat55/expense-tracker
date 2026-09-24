import { Card, EmptyState } from "../common/primitives";
import type { Expense } from "../../types/expense";
import "./dashboard.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const recent = expenses.slice(0, 6);

  return (
    <Card>
      <div className="db-card-header">
        <h3>Recent expenses</h3>
      </div>
      {recent.length === 0 ? (
        <EmptyState title="No expenses yet" description="Your latest transactions will show up here." />
      ) : (
        <div className="db-recent-list">
          {recent.map((e) => (
            <div className="db-recent-row" key={e.id}>
              <div>
                <div className="db-recent-row__category">{e.category}</div>
                <div className="db-recent-row__note">{e.note || "—"}</div>
              </div>
              <div className="db-recent-row__right">
                <div className="db-recent-row__amount">{formatCurrency(Number(e.amount))}</div>
                <div className="db-recent-row__date">{new Date(e.date).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
