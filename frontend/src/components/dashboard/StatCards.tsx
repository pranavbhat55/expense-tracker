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
  const supporting = [
    { label: "Transactions", value: String(summary.count) },
    { label: "Average", value: formatCurrency(summary.average) },
    { label: "Largest", value: formatCurrency(summary.highest) },
  ];

  return (
    <div className="db-ledger-hero">
      <div className="db-ledger-hero__main">
        <span className="db-ledger-hero__label">Total spent · {periodLabel}</span>
        <span className="db-ledger-hero__figure num">{formatCurrency(summary.total)}</span>
      </div>
      <div className="db-ledger-hero__stats">
        {supporting.map((s, i) => (
          <div className="db-ledger-hero__stat" key={s.label}>
            {i > 0 && <span className="db-ledger-hero__divider" aria-hidden />}
            <span className="db-ledger-hero__stat-label">{s.label}</span>
            <span className="db-ledger-hero__stat-value num">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
