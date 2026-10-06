import { Card, EmptyState } from "../common/primitives";
import { RadialProgress } from "../common/RadialProgress";
import type { ExpenseSummary } from "../../types/expense";
import type { Budget } from "../../api/expenses";
import { formatCurrency } from "../../utils/format";
import "./dashboard.css";

export function BudgetHealth({ budgets, summary }: { budgets: Budget[]; summary: ExpenseSummary | null }) {
  if (budgets.length === 0) {
    return (
      <Card>
        <div className="db-card-header"><h3>Budget health</h3></div>
        <EmptyState title="No budgets set" description="Set a monthly budget to track how you're pacing." />
      </Card>
    );
  }

  const spendByCategory = new Map((summary?.byCategory ?? []).map((c) => [c.category, c.total]));

  return (
    <Card>
      <div className="db-card-header"><h3>Budget health</h3><p>Spend vs. limit this period</p></div>
      <div className="db-ring-grid">
        {budgets.map((b) => {
          const limit = Number(b.amount);
          const spent = spendByCategory.get(b.category) ?? 0;
          const pct = limit > 0 ? (spent / limit) * 100 : 0;
          const over = limit > 0 && spent > limit;
          const tone = over ? "danger" : pct > 80 ? "warning" : "success";
          return (
            <div className="db-ring-item" key={b.id}>
              <RadialProgress pct={pct} tone={tone} label={over ? "!" : `${Math.round(pct)}%`} />
              <div className="db-ring-item__meta">
                <strong>{b.category}</strong>
                <span className="num">{formatCurrency(spent)} <em>of {formatCurrency(limit)}</em></span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
