import type { ExpenseSummary } from "../../types/expense";
import { formatCurrency } from "../../utils/format";
import "./dashboard.css";

export function StatCards({ summary, periodLabel }: { summary: ExpenseSummary; periodLabel: string }) {
  const supporting = [
    { label: "Transactions", value: String(summary.count) },
    { label: "Average", value: formatCurrency(summary.average) },
    { label: "Largest", value: formatCurrency(summary.highest) },
  ];
  const top = [...summary.byCategory].sort((a, b) => b.total - a.total).slice(0, 6);
  const max = Math.max(1, ...top.map((c) => c.total));

  return (
    <div className="db-ledger-hero">
      <div className="db-ledger-hero__main">
        <span className="db-ledger-hero__label">Total spent · {periodLabel}</span>
        <span className="db-ledger-hero__figure num">{formatCurrency(summary.total)}</span>
        {top.length > 0 && (
          <div className="db-spark" aria-hidden>
            {top.map((c) => (
              <span key={c.category} className="db-spark__bar" style={{ height: `${8 + (c.total / max) * 24}px` }} title={c.category} />
            ))}
          </div>
        )}
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
