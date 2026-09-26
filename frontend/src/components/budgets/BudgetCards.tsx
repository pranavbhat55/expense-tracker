import { Badge, Button, EmptyState } from "../common/primitives";
import type { Budget } from "../../api/expenses";
import type { ExpenseSummary } from "../../types/expense";
import "./budgets.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BudgetCards({
  budgets,
  summary,
  onEdit,
  onDelete,
  onAdd,
}: {
  budgets: Budget[];
  summary: ExpenseSummary | null;
  onEdit: (budget: Budget) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}) {
  if (budgets.length === 0) {
    return <EmptyState title="No budgets set for this month" action={<Button onClick={onAdd}>Set a budget</Button>} />;
  }

  const spendByCategory = new Map((summary?.byCategory ?? []).map((c) => [c.category, c.total]));

  return (
    <div className="bg-ledger">
      {budgets.map((budget) => {
        const limit = Number(budget.amount);
        const spent = spendByCategory.get(budget.category) ?? 0;
        const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        const over = limit > 0 && spent > limit;
        const tone = over ? "danger" : pct > 80 ? "warning" : "success";

        return (
          <div className="bg-row" key={budget.id}>
            <div className="bg-row__top">
              <div className="bg-row__category">
                <strong>{budget.category}</strong>
                <span>{budget.month}</span>
              </div>
              <Badge tone={tone}>{over ? "Over budget" : `${Math.round(pct)}%`}</Badge>
            </div>
            <div className="bg-row__track">
              <div className={`bg-row__fill bg-row__fill--${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="bg-row__bottom">
              <span className="bg-row__nums num">
                {formatCurrency(spent)} of {formatCurrency(limit)}
              </span>
              <span className="bg-row__actions">
                <button className="bg-row__action" onClick={() => onEdit(budget)}>Edit</button>
                <button className="bg-row__action bg-row__action--danger" onClick={() => onDelete(budget.id)}>Delete</button>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
