import { Card } from "../common/primitives";
import type { ExpenseSummary } from "../../types/expense";
import "./dashboard.css";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function StatCards({ summary, periodLabel }: { summary: ExpenseSummary; periodLabel: string }) {
  const stats = [
    { label: "Total spent", value: formatCurrency(summary.total), sub: periodLabel },
    { label: "Transactions", value: String(summary.count), sub: "expenses recorded" },
    { label: "Avg. expense", value: formatCurrency(summary.average), sub: "per transaction" },
    { label: "Largest expense", value: formatCurrency(summary.highest), sub: "single transaction" },
  ];

  return (
    <div className="db-stat-grid">
      {stats.map((s) => (
        <Card key={s.label} className="db-stat-card">
          <div className="db-stat-card__label">{s.label}</div>
          <div className="db-stat-card__value">{s.value}</div>
          <div className="db-stat-card__sub">{s.sub}</div>
        </Card>
      ))}
    </div>
  );
}
