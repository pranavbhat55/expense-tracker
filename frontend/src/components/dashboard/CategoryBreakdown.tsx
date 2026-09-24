import { Card, EmptyState } from "../common/primitives";
import type { ExpenseSummary } from "../../types/expense";
import "./dashboard.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CategoryBreakdown({ summary }: { summary: ExpenseSummary | null }) {
  if (!summary || summary.byCategory.length === 0) {
    return (
      <Card>
        <div className="db-card-header">
          <h3>By category</h3>
        </div>
        <EmptyState title="No categories yet" description="Add expenses to see a breakdown." />
      </Card>
    );
  }

  const max = Math.max(...summary.byCategory.map((c) => c.total));
  const sorted = [...summary.byCategory].sort((a, b) => b.total - a.total);

  return (
    <Card>
      <div className="db-card-header">
        <h3>By category</h3>
        <p>Share of total spend</p>
      </div>
      <div className="db-category-list">
        {sorted.map((c) => (
          <div className="db-category-row" key={c.category}>
            <div className="db-category-row__top">
              <span>{c.category}</span>
              <span>{formatCurrency(c.total)}</span>
            </div>
            <div className="db-category-row__track">
              <div className="db-category-row__fill" style={{ width: `${max ? (c.total / max) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
