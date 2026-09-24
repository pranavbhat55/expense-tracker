import { Badge, Card, EmptyState } from "../common/primitives";
import type { ExpenseSummary } from "../../types/expense";
import type { Budget } from "../../api/expenses";
import "./dashboard.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetHealth({ budgets, summary }: { budgets: Budget[]; summary: ExpenseSummary | null }) {
  if (budgets.length === 0) {
    return (
      <Card>
        <div className="db-card-header">
          <h3>Budget health</h3>
        </div>
        <EmptyState title="No budgets set" description="Set a monthly budget to track how you're pacing." />
      </Card>
    );
  }

  const spendByCategory = new Map((summary?.byCategory ?? []).map((c) => [c.category, c.total]));

  return (
    <Card>
      <div className="db-card-header">
        <h3>Budget health</h3>
        <p>Spend vs. limit this period</p>
      </div>
      <div className="db-budget-list">
        {budgets.map((b) => {
          const limit = Number(b.amount);
          const spent = spendByCategory.get(b.category) ?? 0;
          const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const over = limit > 0 && spent > limit;
          const tone = over ? "danger" : pct > 80 ? "warning" : "success";
          return (
            <div className="db-budget-row" key={b.id}>
              <div className="db-budget-row__top">
                <span>{b.category}</span>
                <Badge tone={tone}>{over ? "Over budget" : `${Math.round(pct)}%`}</Badge>
              </div>
              <div className="db-category-row__track">
                <div className={`db-budget-row__fill db-budget-row__fill--${tone}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="db-budget-row__nums">
                {formatCurrency(spent)} of {formatCurrency(limit)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
